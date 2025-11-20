# Complete Setup Guide - Nissmart Platform

This guide will walk you through setting up the entire Nissmart platform from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+**: [Download here](https://nodejs.org/)
- **PostgreSQL 14+**: [Download here](https://www.postgresql.org/download/)
- **npm** or **yarn**: Comes with Node.js
- **Git**: For cloning the repository

## Part 1: Database Setup

### Option A: macOS (Using Homebrew)

```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Create database
createdb nissmart

# Optional: Set password for postgres user
psql postgres
\password postgres
# Enter: root
\q
```

### Option B: Using Docker

```bash
# Run PostgreSQL in Docker
docker run --name nissmart-postgres \
  -e POSTGRES_PASSWORD=root \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=nissmart \
  -p 5432:5432 \
  -d postgres:14

# Verify it's running
docker ps
```

### Option C: Manual Installation

1. Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. Open pgAdmin or psql
3. Create a new database named `nissmart`
4. Set a password for the postgres user (e.g., `root`)

### Verify Database Connection

```bash
# Test connection
psql -h localhost -U postgres -d nissmart

# If successful, you'll see:
# nissmart=#

# Exit with:
\q
```

## Part 2: Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

The `.env` file already exists with default values:

```bash
DATABASE_URL="postgresql://postgres:root@localhost:5432/nissmart?schema=public"
PORT=3001
NODE_ENV=development
```

**If your PostgreSQL credentials are different**, edit `.env`:

```bash
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/nissmart?schema=public"
```

### 4. Run Database Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations (creates tables)
npm run prisma:migrate

# When prompted for migration name, enter:
# init
```

**Expected output:**

```
✔ Generated Prisma Client
✔ Applying migration: 20231120000000_init
✔ Database synchronized with schema
```

### 5. Verify Database Schema

```bash
# Open Prisma Studio (visual database browser)
npm run prisma:studio
```

This opens `http://localhost:5555` where you can see your `User` and `Transaction` tables.

### 6. Start Backend Server

```bash
npm run dev
```

**Expected output:**

```
🚀 Server running on http://localhost:3001
📚 API Documentation: http://localhost:3001/api-docs
```

### 7. Test Backend

Open your browser to:

- **API Docs**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

You should see the Swagger documentation!

## Part 3: Frontend Setup

### 1. Open New Terminal Window

Keep the backend running, open a new terminal.

### 2. Navigate to Frontend Directory

```bash
cd ui
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment (Optional)

The `.env.local` file is already configured:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Only change this if your backend is running on a different port.

### 5. Start Frontend Server

```bash
npm run dev
```

**Expected output:**

```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in 2.5s
```

### 6. Open Application

Navigate to: **http://localhost:3000**

You should see the Nissmart home page!

## Part 4: Testing the Application

### Step 1: Create Users

1. Go to http://localhost:3000
2. Click **"User Portal"**
3. Click **"New User"** button
4. Create first user:
   - Name: `Alice Smith`
   - Email: `alice@example.com`
5. Create second user:
   - Name: `Bob Johnson`
   - Email: `bob@example.com`

### Step 2: Test Deposit

1. Click on Alice's card
2. Click **"Deposit"** button
3. Enter amount: `1000`
4. Click "Deposit"
5. ✅ Balance should update to $1000.00

### Step 3: Test Transfer

1. With Alice selected, click **"Transfer"**
2. Select recipient: Bob Johnson
3. Enter amount: `250`
4. Click "Transfer"
5. ✅ Alice's balance: $750.00
6. Go back and select Bob
7. ✅ Bob's balance: $250.00

### Step 4: Test Withdrawal

1. Select Alice (balance: $750)
2. Click **"Withdraw"**
3. Enter amount: `100`
4. Click "Withdraw"
5. ✅ If successful: Balance updates to $650
6. ⚠️ If failed (10% chance): Shows failure message, balance unchanged

### Step 5: View Admin Dashboard

1. Go back to home (click logo or browser back)
2. Click **"Admin Dashboard"**
3. ✅ See system metrics:
   - Total Users: 2
   - Total Wallet Value: $650 (or $750 if withdrawal failed)
   - Recent Transactions table shows all activity

## Part 5: API Testing with Swagger

### 1. Open Swagger UI

Navigate to: http://localhost:3001/api-docs

### 2. Test Create User

1. Find `POST /api/users`
2. Click "Try it out"
3. Enter request body:

```json
{
  "email": "charlie@example.com",
  "name": "Charlie Brown"
}
```

4. Click "Execute"
5. ✅ Should return 201 with user data

### 3. Test Deposit

1. Find `POST /api/deposit`
2. Click "Try it out"
3. Enter (use Charlie's userId from above):

```json
{
  "userId": "paste-charlie-id-here",
  "amount": 500,
  "idempotencyKey": "test-deposit-1",
  "description": "Initial deposit"
}
```

4. Click "Execute"
5. ✅ Should return 201 with transaction data

### 4. Test Idempotency

1. Execute the same deposit request again (same idempotencyKey)
2. ✅ Should return 200 (not 201) with the same transaction
3. This proves idempotency works!

## Troubleshooting

### Backend won't start

**Error**: `Can't reach database server`

**Solution**:

```bash
# Check if PostgreSQL is running
brew services list | grep postgresql
# or
docker ps | grep postgres

# Start if not running
brew services start postgresql@14
# or
docker start nissmart-postgres
```

**Error**: `Invalid `prisma.user.findUnique()` invocation`

**Solution**:

```bash
cd backend
npm run prisma:generate
```

### Frontend can't connect to backend

**Error**: Network error or 404s

**Solution**:

1. Verify backend is running on port 3001
2. Check `.env.local` in frontend:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

3. Restart frontend server

### Port already in use

**Error**: `Port 3001 is already in use`

**Solution**:

```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9

# Or change port in backend/.env
PORT=3002
```

### Migration fails

**Error**: `Migration failed`

**Solution**:

```bash
# Reset database (WARNING: Deletes all data)
cd backend
npx prisma migrate reset --force

# Then run migrations again
npm run prisma:migrate
```

### TypeScript errors in editor

**Solution**:

```bash
# Restart TypeScript server in VS Code
# Command Palette (Cmd+Shift+P) → "TypeScript: Restart TS Server"

# Or regenerate Prisma client
cd backend
npm run prisma:generate
```

## Advanced: Production Deployment

### Backend Deployment

```bash
cd backend

# Build
npm run build

# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."
export NODE_ENV=production

# Run migrations
npx prisma migrate deploy

# Start
npm start
```

### Frontend Deployment

```bash
cd ui

# Build
npm run build

# Start
npm start

# Or deploy to Vercel
vercel deploy
```

## Next Steps

1. ✅ Test all transaction flows
2. ✅ Check admin dashboard metrics
3. ✅ Explore Swagger API documentation
4. ✅ Review flow diagrams in `/docs/flow-diagrams.md`
5. ✅ Read architecture documentation in `/docs/architecture.md`
6. 📹 Record a video walkthrough (2-5 minutes)

## Quick Reference

### Useful Commands

```bash
# Backend
npm run dev              # Start dev server
npm run build            # Build for production
npm run prisma:studio    # Open database GUI
npm run prisma:migrate   # Run migrations

# Frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run linter

# Database
psql nissmart            # Connect to database
\dt                      # List tables
\d "User"                # Describe User table
\d "Transaction"         # Describe Transaction table
```

### Important URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api-docs
- **Prisma Studio**: http://localhost:5555

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure PostgreSQL is running
4. Check console output for error messages
5. Review the architecture documentation

---

**Congratulations!** 🎉 Your Nissmart platform is now up and running!
