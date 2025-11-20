import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";

// Validation schemas
const depositSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive().min(0.01),
  idempotencyKey: z.string().min(1),
  description: z.string().optional(),
});

const transferSchema = z.object({
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  amount: z.number().positive().min(0.01),
  idempotencyKey: z.string().min(1),
  description: z.string().optional(),
});

const withdrawSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive().min(0.01),
  idempotencyKey: z.string().min(1),
  description: z.string().optional(),
});

/**
 * Deposit funds to user account
 * Uses idempotency key to prevent duplicate deposits
 */
export const deposit = async (req: Request, res: Response) => {
  try {
    const { userId, amount, idempotencyKey, description } = depositSchema.parse(req.body);

    // Check for existing transaction with same idempotency key
    const existingTransaction = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (existingTransaction) {
      // Return existing transaction (idempotent response)
      return res.status(200).json(existingTransaction);
    }

    // Execute deposit in a transaction
    const result = await prisma.$transaction(async tx => {
      // Verify user exists
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          type: "DEPOSIT",
          status: "COMPLETED",
          amount,
          idempotencyKey,
          receiverId: userId,
          description: description || "Deposit",
        },
      });

      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      return transaction;
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid input",
        details: error.errors,
      });
    }
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        error: "User not found",
      });
    }
    console.error("Error processing deposit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Transfer funds between users
 * Uses atomic transaction with row locking to prevent race conditions
 */
export const transfer = async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, amount, idempotencyKey, description } = transferSchema.parse(req.body);

    // Validate sender and receiver are different
    if (senderId === receiverId) {
      return res.status(400).json({
        error: "Invalid transfer",
        details: "Cannot transfer to the same account",
      });
    }

    // Check for existing transaction with same idempotency key
    const existingTransaction = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (existingTransaction) {
      // Return existing transaction (idempotent response)
      return res.status(200).json(existingTransaction);
    }

    // Execute transfer in a transaction with row locking
    const result = await prisma.$transaction(
      async tx => {
        // Lock both users to prevent concurrent modifications
        // Order by ID to prevent deadlocks
        const [firstId, secondId] = [senderId, receiverId].sort();

        const firstUser = await tx.user.findUnique({
          where: { id: firstId },
        });

        const secondUser = await tx.user.findUnique({
          where: { id: secondId },
        });

        if (!firstUser || !secondUser) {
          throw new Error("USER_NOT_FOUND");
        }

        // Get sender and receiver
        const sender = firstId === senderId ? firstUser : secondUser;
        const receiver = firstId === receiverId ? firstUser : secondUser;

        // Check sufficient balance
        if (Number(sender.balance) < amount) {
          throw new Error("INSUFFICIENT_FUNDS");
        }

        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            type: "TRANSFER",
            status: "COMPLETED",
            amount,
            idempotencyKey,
            senderId,
            receiverId,
            description: description || "Internal Transfer",
          },
        });

        // Update sender balance (decrement)
        await tx.user.update({
          where: { id: senderId },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });

        // Update receiver balance (increment)
        await tx.user.update({
          where: { id: receiverId },
          data: {
            balance: {
              increment: amount,
            },
          },
        });

        return transaction;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid input",
        details: error.errors,
      });
    }
    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        return res.status(404).json({
          error: "User not found",
        });
      }
      if (error.message === "INSUFFICIENT_FUNDS") {
        return res.status(400).json({
          error: "Insufficient funds",
          details: "Sender does not have enough balance for this transfer",
        });
      }
    }
    console.error("Error processing transfer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Withdraw funds from user account
 * Simulates external system with random success/failure
 */
export const withdraw = async (req: Request, res: Response) => {
  try {
    const { userId, amount, idempotencyKey, description } = withdrawSchema.parse(req.body);

    // Check for existing transaction with same idempotency key
    const existingTransaction = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (existingTransaction) {
      // Return existing transaction (idempotent response)
      return res.status(200).json(existingTransaction);
    }

    // Execute withdrawal in a transaction
    const result = await prisma.$transaction(async tx => {
      // Verify user exists and has sufficient balance
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      if (Number(user.balance) < amount) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // Create pending transaction record
      const transaction = await tx.transaction.create({
        data: {
          type: "WITHDRAWAL",
          status: "PROCESSING",
          amount,
          idempotencyKey,
          senderId: userId,
          description: description || "Withdrawal",
        },
      });

      // Simulate external system processing (90% success rate)
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        // Update transaction status to completed
        const completedTransaction = await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "COMPLETED",
          },
        });

        // Deduct from user balance
        await tx.user.update({
          where: { id: userId },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });

        return completedTransaction;
      } else {
        // Simulate failure
        const failedTransaction = await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "FAILED",
            failureReason: "External system rejected the withdrawal",
          },
        });

        return failedTransaction;
      }
    });

    const statusCode = result.status === "COMPLETED" ? 201 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid input",
        details: error.errors,
      });
    }
    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        return res.status(404).json({
          error: "User not found",
        });
      }
      if (error.message === "INSUFFICIENT_FUNDS") {
        return res.status(400).json({
          error: "Insufficient funds",
          details: "User does not have enough balance for this withdrawal",
        });
      }
    }
    console.error("Error processing withdrawal:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get user transaction history
 */
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Get all transactions where user is sender or receiver
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ senderId: user_id }, { receiverId: user_id }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get admin dashboard statistics
 */
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    // Get total users
    const totalUsers = await prisma.user.count();

    // Get total value in wallets
    const walletSum = await prisma.user.aggregate({
      _sum: {
        balance: true,
      },
    });

    // Get total transfers
    const totalTransfers = await prisma.transaction.count({
      where: {
        type: "TRANSFER",
        status: "COMPLETED",
      },
    });

    // Get total withdrawals
    const totalWithdrawals = await prisma.transaction.count({
      where: {
        type: "WITHDRAWAL",
        status: "COMPLETED",
      },
    });

    // Get total deposits
    const totalDeposits = await prisma.transaction.count({
      where: {
        type: "DEPOSIT",
        status: "COMPLETED",
      },
    });

    // Get recent transactions (last 50)
    const recentTransactions = await prisma.transaction.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      totalUsers,
      totalValueInWallets: Number(walletSum._sum.balance || 0),
      totalTransfers,
      totalWithdrawals,
      totalDeposits,
      recentTransactions,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
