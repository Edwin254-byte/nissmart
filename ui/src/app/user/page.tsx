"use client";

import { useState, useEffect } from "react";
import { userApi, transactionApi, User, Transaction, generateIdempotencyKey } from "@/lib/api";
import { ArrowLeft, Plus, Send, ArrowDownToLine, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";

export default function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Load transactions when user is selected
  useEffect(() => {
    if (selectedUser) {
      loadTransactions();
      loadBalance();
    }
  }, [selectedUser?.id]);

  const loadUsers = async () => {
    try {
      const response = await userApi.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    }
  };

  const loadTransactions = async () => {
    if (!selectedUser) return;
    try {
      const response = await transactionApi.getUserTransactions(selectedUser.id);
      setTransactions(response.data);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  const loadBalance = async () => {
    if (!selectedUser) return;
    try {
      const response = await userApi.getBalance(selectedUser.id);
      setSelectedUser(prev => (prev ? { ...prev, balance: response.data.balance } : null));
    } catch (error) {
      console.error("Error loading balance:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;

    try {
      setLoading(true);
      const response = await userApi.create({ email, name });
      setUsers([response.data, ...users]);
      setShowNewUserForm(false);
      toast.success("User created successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;

    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount") as string);
    const description = formData.get("description") as string;

    try {
      setLoading(true);
      await transactionApi.deposit({
        userId: selectedUser.id,
        amount,
        idempotencyKey: generateIdempotencyKey(),
        description,
      });
      await loadBalance();
      await loadTransactions();
      setShowDepositForm(false);
      toast.success("Deposit successful!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to deposit");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;

    const formData = new FormData(e.currentTarget);
    const receiverId = formData.get("receiverId") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const description = formData.get("description") as string;

    try {
      setLoading(true);
      await transactionApi.transfer({
        senderId: selectedUser.id,
        receiverId,
        amount,
        idempotencyKey: generateIdempotencyKey(),
        description,
      });
      await loadBalance();
      await loadTransactions();
      setShowTransferForm(false);
      toast.success("Transfer successful!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to transfer");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;

    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount") as string);
    const description = formData.get("description") as string;

    try {
      setLoading(true);
      const response = await transactionApi.withdraw({
        userId: selectedUser.id,
        amount,
        idempotencyKey: generateIdempotencyKey(),
        description,
      });

      if (response.data.status === "FAILED") {
        toast.error(`Withdrawal failed: ${response.data.failureReason}`);
      } else {
        toast.success("Withdrawal successful!");
      }

      await loadBalance();
      await loadTransactions();
      setShowWithdrawForm(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to withdraw");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/" className="flex items-center text-blue-600 hover:text-blue-700 mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">User Portal</h1>
              <p className="text-gray-600 mt-2">Select a user to manage their account</p>
            </div>
            <button
              onClick={() => setShowNewUserForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New User
            </button>
          </div>

          {showNewUserForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">Create New User</h2>
                <form onSubmit={handleCreateUser}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowNewUserForm(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? "Creating..." : "Create User"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
              >
                <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                <p className="text-2xl font-bold text-blue-600">KES {(+user.balance || 0).toFixed(2)}</p>
              </button>
            ))}
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No users found. Create one to get started!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => setSelectedUser(null)}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to User Selection
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{selectedUser.name}</h1>
              <p className="text-gray-600">{selectedUser.email}</p>
            </div>
            <button
              onClick={() => {
                loadBalance();
                loadTransactions();
              }}
              className="p-2 text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <p className="text-gray-600 mb-2">Current Balance</p>
          <p className="text-4xl font-bold text-blue-600 mb-6">KES {selectedUser.balance.toFixed(2)}</p>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setShowDepositForm(true)}
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Deposit
            </button>
            <button
              onClick={() => setShowTransferForm(true)}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Transfer
            </button>
            <button
              onClick={() => setShowWithdrawForm(true)}
              className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Withdraw
            </button>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Transaction History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{tx.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {tx.description || "-"}
                      {tx.type === "TRANSFER" && tx.sender && tx.receiver && (
                        <span className="block text-xs text-gray-500">
                          {tx.senderId === selectedUser.id ? `To: ${tx.receiver.name}` : `From: ${tx.sender.name}`}
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-semibold ${
                        tx.type === "DEPOSIT" || (tx.type === "TRANSFER" && tx.receiverId === selectedUser.id)
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {tx.type === "DEPOSIT" || (tx.type === "TRANSFER" && tx.receiverId === selectedUser.id)
                        ? "+"
                        : "-"}
                      KES {tx.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          tx.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : tx.status === "FAILED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(tx.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && <p className="text-center py-8 text-gray-500">No transactions yet</p>}
          </div>
        </div>

        {/* Deposit Modal */}
        {showDepositForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Deposit Funds</h2>
              <form onSubmit={handleDeposit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                  <input
                    type="text"
                    name="description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowDepositForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Deposit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {showTransferForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Transfer Funds</h2>
              <form onSubmit={handleTransfer}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipient</label>
                  <select
                    name="receiverId"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select recipient</option>
                    {users
                      .filter(u => u.id !== selectedUser.id)
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                  <input
                    type="text"
                    name="description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowTransferForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Transfer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Withdraw Funds</h2>
              <form onSubmit={handleWithdraw}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                  <input
                    type="text"
                    name="description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Withdraw"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
