import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, name } = createUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists",
        details: "A user with this email already exists",
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        balance: 0,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid input",
        details: error.errors,
      });
    }
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserBalance = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: { id: true, balance: true },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        details: "No user found with the provided ID",
      });
    }

    res.json({
      userId: user.id,
      balance: Number(user.balance),
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
