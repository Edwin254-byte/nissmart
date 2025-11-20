# Nissmart - Micro-Savings and Payout Platform

A full-stack platform for managing user accounts, deposits, transfers, and withdrawals with robust transaction safety mechanisms.

## 🏗️ Architecture

- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **API Documentation**: Swagger/OpenAPI

## 📁 Project Structure

```
nissmart/
├── backend/          # Express API server
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── routes/          # API routes with Swagger docs
│   │   ├── lib/             # Utilities (Prisma client)
│   │   └── index.ts         # Server entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── ui/               # Next.js frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── user/        # User portal
│   │   │   ├── admin/       # Admin dashboard
│   │   │   └── page.tsx     # Home page
│   │   └── lib/
│   │       └── api.ts       # API client
│   └── package.json
└── docs/             # Documentation (coming soon)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Setup (5 minutes)

```bash
# 1. Setup database (choose one method)
# macOS with Homebrew:
brew install postgresql@14 && brew services start postgresql@14
createdb nissmart

# OR Docker:
docker run --name nissmart-postgres -e POSTGRES_PASSWORD=root \
  -e POSTGRES_DB=nissmart -p 5432:5432 -d postgres:14

# 2. Backend
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate  # Enter "init" when prompted
npm run dev             # Runs on http://localhost:3001

# 3. Frontend (in new terminal)
cd ui
npm install
npm run dev             # Runs on http://localhost:3000
```

**🎉 Done!** Open http://localhost:3000

📖 **Detailed Setup Guide**: See [docs/SETUP.md](docs/SETUP.md) for step-by-step instructions with troubleshooting.## 🔑 Key Features

### Safety Mechanisms

- ✅ **Idempotency**: Prevent duplicate transactions using idempotency keys
- ✅ **Atomic Transactions**: Database transactions with SERIALIZABLE isolation
- ✅ **No Negative Balances**: Validation before withdrawal/transfer
- ✅ **No Double Spending**: Row-level locking and ordered updates
- ✅ **Balance Caching**: Balance stored in user table for performance

### User Portal (`/user`)

- Create and select users
- View current balance
- Deposit funds
- Transfer funds to other users
- Withdraw funds (with simulated external system)
- View transaction history

### Admin Dashboard (`/admin`)

- System metrics (users, wallet value, transaction counts)
- Recent transactions table (last 50)
- Real-time statistics
- Transaction monitoring

## 📡 API Endpoints

### Users

- `POST /api/users` - Create user
- `GET /api/users` - List all users
- `GET /api/balance/:user_id` - Get user balance

### Transactions

- `POST /api/deposit` - Deposit funds
- `POST /api/transfer` - Transfer between users
- `POST /api/withdraw` - Withdraw funds
- `GET /api/transactions/:user_id` - Get user transactions

### Admin

- `GET /api/admin/stats` - System statistics

## 🧪 Testing the System

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd ui && npm run dev`
3. Open `http://localhost:3000`
4. Create some test users
5. Test deposit, transfer, and withdrawal flows
6. View the admin dashboard

## 🗄️ Database Schema

- **User**: id, email, name, balance, timestamps
- **Transaction**: id, type, status, amount, senderId, receiverId, idempotencyKey, metadata, timestamps

## 📊 Documentation

- **[Architecture Document](docs/architecture.md)**: Complete system design, data models, and safety mechanisms
- **[Flow Diagrams](docs/flow-diagrams.md)**: Visual representation of deposit, transfer, and withdrawal flows
- **[Setup Guide](docs/SETUP.md)**: Detailed step-by-step setup instructions with troubleshooting

### Key Documentation Highlights

- **System Overview**: Architecture components and design decisions
- **Data Model**: Database schema with rationale
- **Transaction Safety**: How we prevent double-spending, negative balances, and ensure atomicity
- **Flow Diagrams**: Three critical flows with safety mechanisms highlighted
- **Error Handling**: Comprehensive error response strategies

## 📝 License

MIT
