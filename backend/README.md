# Nissmart Backend API

Backend API for the Micro-Savings and Payout Platform.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure database:

   - Update `.env` file with your PostgreSQL connection string
   - Or use the example: `cp .env.example .env`

3. Run Prisma migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Documentation

Interactive API documentation (Swagger) is available at:
`http://localhost:3001/api-docs`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## API Endpoints

### Users

- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users
- `GET /api/balance/:user_id` - Get user balance

### Transactions

- `POST /api/deposit` - Deposit funds
- `POST /api/transfer` - Transfer funds between users
- `POST /api/withdraw` - Withdraw funds
- `GET /api/transactions/:user_id` - Get user transaction history

### Admin

- `GET /api/admin/stats` - Get system statistics and metrics
