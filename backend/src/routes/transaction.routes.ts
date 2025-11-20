import { Router } from "express";
import { deposit, transfer, withdraw, getTransactions, getAdminStats } from "../controllers/transaction.controller";

const router = Router();

/**
 * @swagger
 * /api/deposit:
 *   post:
 *     summary: Deposit funds to user account
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *               - idempotencyKey
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               idempotencyKey:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Deposit successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Duplicate idempotency key
 */
router.post("/deposit", deposit);

/**
 * @swagger
 * /api/transfer:
 *   post:
 *     summary: Transfer funds between users
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderId
 *               - receiverId
 *               - amount
 *               - idempotencyKey
 *             properties:
 *               senderId:
 *                 type: string
 *                 format: uuid
 *               receiverId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               idempotencyKey:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transfer successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid input or insufficient funds
 *       404:
 *         description: User not found
 *       409:
 *         description: Duplicate idempotency key
 */
router.post("/transfer", transfer);

/**
 * @swagger
 * /api/withdraw:
 *   post:
 *     summary: Withdraw funds from user account
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *               - idempotencyKey
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               idempotencyKey:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Withdrawal initiated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid input or insufficient funds
 *       404:
 *         description: User not found
 *       409:
 *         description: Duplicate idempotency key
 */
router.post("/withdraw", withdraw);

/**
 * @swagger
 * /api/transactions/{user_id}:
 *   get:
 *     summary: Get user transaction history
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transaction history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: User not found
 */
router.get("/transactions/:user_id", getTransactions);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: System statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: number
 *                 totalValueInWallets:
 *                   type: number
 *                 totalTransfers:
 *                   type: number
 *                 totalWithdrawals:
 *                   type: number
 *                 recentTransactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 */
router.get("/admin/stats", getAdminStats);

export default router;
