import Link from "next/link";
import { ArrowRight, Users, DollarSign, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Welcome to Nissmart</h1>
          <p className="text-xl text-gray-600 mb-8">Your trusted Micro-Savings and Payout Platform</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* User Portal Card */}
          <Link
            href="/user"
            className="group bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">User Portal</h2>
            <p className="text-gray-600 mb-4">
              Manage your account, deposit funds, make transfers, and track your transaction history.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                View balance & history
              </li>
              <li className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Deposit & transfer funds
              </li>
            </ul>
          </Link>

          {/* Admin Dashboard Card */}
          <Link
            href="/admin"
            className="group bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-indigo-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Admin Dashboard</h2>
            <p className="text-gray-600 mb-4">
              Monitor system metrics, view all transactions, and oversee platform operations.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                System overview & metrics
              </li>
              <li className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Transaction monitoring
              </li>
            </ul>
          </Link>
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-500 text-sm">A secure and reliable platform for managing your finances</p>
        </div>
      </div>
    </div>
  );
}
