import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: "DEPOSIT" | "TRANSFER" | "WITHDRAWAL";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  amount: number;
  senderId?: string;
  receiverId?: string;
  sender?: {
    id: string;
    name: string;
    email: string;
  };
  receiver?: {
    id: string;
    name: string;
    email: string;
  };
  description?: string;
  failureReason?: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalValueInWallets: number;
  totalTransfers: number;
  totalWithdrawals: number;
  totalDeposits: number;
  recentTransactions: Transaction[];
}

// User API
export const userApi = {
  create: (data: { email: string; name: string }) => api.post<User>("/users", data),

  getAll: () => api.get<User[]>("/users"),

  getBalance: (userId: string) => api.get<{ userId: string; balance: number }>(`/balance/${userId}`),
};

// Transaction API
export const transactionApi = {
  deposit: (data: { userId: string; amount: number; idempotencyKey: string; description?: string }) =>
    api.post<Transaction>("/deposit", data),

  transfer: (data: {
    senderId: string;
    receiverId: string;
    amount: number;
    idempotencyKey: string;
    description?: string;
  }) => api.post<Transaction>("/transfer", data),

  withdraw: (data: { userId: string; amount: number; idempotencyKey: string; description?: string }) =>
    api.post<Transaction>("/withdraw", data),

  getUserTransactions: (userId: string) => api.get<Transaction[]>(`/transactions/${userId}`),
};

// Admin API
export const adminApi = {
  getStats: () => api.get<AdminStats>("/admin/stats"),
};

// Utility function to generate idempotency key
export const generateIdempotencyKey = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
