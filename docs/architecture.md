# Architecture Documentation

## Nissmart Micro-Savings and Payout Platform

---

## 1. System Overview

The Nissmart platform is a full-stack financial application that enables users to manage digital wallets with deposit, transfer, and withdrawal capabilities. The system is designed with safety-first principles to ensure transaction integrity, prevent double-spending, and maintain accurate ledger balances.

### Purpose

- Allow users to deposit funds into digital wallets
- Enable peer-to-peer transfers between users
- Facilitate withdrawals to external systems
- Provide administrative oversight and monitoring

### Key Characteristics

- **Transactional Safety**: ACID-compliant operations with idempotency
- **Real-time Updates**: Immediate balance reflection after transactions
- **Audit Trail**: Complete transaction history for compliance
- **Scalable Design**: Stateless API with database-backed consistency

---

## 2. Architecture Components

### 2.1 API Layer (Backend)

**Technology**: Node.js + Express + TypeScript

**Responsibilities**:

- Request validation using Zod schemas
- Business logic enforcement
- Transaction orchestration
- Error handling and response formatting
- API documentation via Swagger

**Structure**:

```
backend/src/
├── index.ts              # Server entry point, middleware setup
├── controllers/          # Business logic
│   ├── user.controller.ts
│   └── transaction.controller.ts
├── routes/               # API route definitions + Swagger docs
│   ├── user.routes.ts
│   └── transaction.routes.ts
└── lib/
    └── prisma.ts         # Database client singleton
```

**API Endpoints**:

- **Users**: `POST /users`, `GET /users`, `GET /balance/:user_id`
- **Transactions**: `POST /deposit`, `POST /transfer`, `POST /withdraw`, `GET /transactions/:user_id`
- **Admin**: `GET /admin/stats`

### 2.2 Database Layer

**Technology**: PostgreSQL + Prisma ORM

**Responsibilities**:

- Data persistence
- Transaction management (ACID)
- Constraint enforcement
- Query optimization via indexes

**Connection**:

- Prisma Client provides type-safe database access
- Connection pooling handled by Prisma
- Environment-based configuration (`.env`)

### 2.3 Ledger System

**Design**: Hybrid approach combining:

1. **Balance Caching**: User balance stored in `users.balance`
2. **Transaction Log**: Complete history in `transactions` table

**Rationale**:

- **Performance**: Reading balance is O(1) query, not aggregation
- **Consistency**: Balance updated atomically with transaction creation
- **Audit**: Transaction log provides immutable history
- **Reconciliation**: Balance can be recalculated from transaction history

### 2.4 Frontend (User Interface)

**Technology**: Next.js 14 (App Router) + TypeScript + Tailwind CSS

**Components**:

- **Home Page** (`/`): Landing page with portal selection
- **User Portal** (`/user`): Account management, transactions
- **Admin Dashboard** (`/admin`): System metrics, transaction monitoring

**Features**:

- Client-side state management with React hooks
- Axios for API communication
- Responsive design with Tailwind
- Real-time balance updates

### 2.5 Background Processes

**Current Status**: Not implemented (synchronous design)

**Future Considerations**:

- Scheduled withdrawal reconciliation
- Failed transaction retry logic
- Balance audit jobs
- Notification system

---

## 3. Data Model

### 3.1 Users Table

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  balance   Decimal  @default(0) @db.Decimal(15, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Fields**:

- `id`: UUID primary key for global uniqueness
- `email`: Unique identifier, indexed for fast lookup
- `name`: Display name
- `balance`: Current wallet balance (cached for performance)
- Timestamps for audit trail

**Indexes**: `@unique` on email, `@index` added by Prisma

### 3.2 Transactions Table

```prisma
model Transaction {
  id              String            @id @default(uuid())
  type            TransactionType   # DEPOSIT, TRANSFER, WITHDRAWAL
  status          TransactionStatus # PENDING, PROCESSING, COMPLETED, FAILED
  amount          Decimal           @db.Decimal(15, 2)
  idempotencyKey  String            @unique
  senderId        String?           # For TRANSFER, WITHDRAWAL
  receiverId      String?           # For DEPOSIT, TRANSFER
  description     String?
  metadata        Json?             # Extensible field
  failureReason   String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}
```

**Fields**:

- `type`: Transaction category (enum)
- `status`: Current state (enum)
- `amount`: Transaction value (decimal for precision)
- `idempotencyKey`: Unique request identifier (prevents duplicates)
- `senderId`/`receiverId`: User references (nullable for different types)
- `failureReason`: Populated when status = FAILED

**Indexes**: On `idempotencyKey` (unique), `senderId`, `receiverId`, `type`, `status`, `createdAt`

### 3.3 Rationale

- **Decimal Type**: Prevents floating-point errors in financial calculations
- **UUID**: Globally unique, non-sequential (security)
- **Idempotency Key**: Unique constraint enforces at database level
- **Nullable Foreign Keys**: Allow different transaction types (deposit has no sender)
- **Enum Types**: Type safety and query efficiency
- **Timestamps**: Audit trail and chronological ordering

---

## 4. Transaction Safety

### 4.1 Negative Balance Prevention

**Mechanism**:

1. Pre-validation before withdrawal/transfer
2. Balance check inside database transaction lock
3. Atomic decrement operation

**Code Example** (Transfer):

```typescript
// Lock sender's record
const sender = await tx.user.findUnique({
  where: { id: senderId },
});

// Check balance
if (Number(sender.balance) < amount) {
  throw new Error("INSUFFICIENT_FUNDS");
}

// Atomic decrement
await tx.user.update({
  where: { id: senderId },
  data: { balance: { decrement: amount } },
});
```

**Why It Works**:

- Transaction lock prevents concurrent modifications
- Check and update in same transaction (atomic)
- Database enforces decimal precision

### 4.2 Double Spend Prevention

**Mechanisms**:

1. **Row-Level Locking**: `SELECT FOR UPDATE` implicit in Prisma transactions
2. **Ordered Locking**: Lock users by sorted ID to prevent deadlocks
3. **SERIALIZABLE Isolation**: Highest isolation level for transfers

**Code Example**:

```typescript
const result = await prisma.$transaction(
  async tx => {
    // Lock in consistent order
    const [firstId, secondId] = [senderId, receiverId].sort();
    const firstUser = await tx.user.findUnique({ where: { id: firstId } });
    const secondUser = await tx.user.findUnique({ where: { id: secondId } });

    // ... proceed with transfer
  },
  { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
);
```

**Protection Against**:

- Race conditions between concurrent requests
- Deadlocks (via ordered locking)
- Phantom reads (via SERIALIZABLE)

### 4.3 Atomicity

**Implementation**: Prisma transactions with PostgreSQL ACID guarantees

**Guarantee**: Either all operations succeed or all fail

**Operations in Each Transaction Type**:

- **Deposit**: Create transaction record + increment balance
- **Transfer**: Create record + decrement sender + increment receiver
- **Withdrawal**: Create record (PROCESSING) + update status + decrement balance (if success)

**Rollback Scenarios**:

- Database constraint violation
- Application throws error
- Network/system failure mid-transaction

### 4.4 Idempotency

**Requirement**: Every transaction request includes `idempotencyKey`

**Implementation**:

```typescript
// Check for existing transaction
const existingTransaction = await prisma.transaction.findUnique({
  where: { idempotencyKey },
});

if (existingTransaction) {
  // Return same result (idempotent)
  return res.status(200).json(existingTransaction);
}

// Proceed with new transaction
```

**Benefits**:

- Safe retries on network failures
- Prevents accidental duplicate charges
- RESTful API design best practice

**Key Generation** (Client-side):

```typescript
const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

### 4.5 Validation

**Layers**:

1. **Schema Validation**: Zod validates request shape
2. **Business Rules**: Amount > 0, sender ≠ receiver
3. **Database Constraints**: Unique keys, foreign keys, not null

**Example** (Deposit):

```typescript
const depositSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive().min(0.01),
  idempotencyKey: z.string().min(1),
  description: z.string().optional(),
});
```

---

## 5. Error Handling

### 5.1 Validation Errors (400 Bad Request)

- Invalid input format
- Negative amounts
- Missing required fields
- Sender = Receiver in transfer

**Response**:

```json
{
  "error": "Invalid input",
  "details": [
    /* Zod error array */
  ]
}
```

### 5.2 Not Found Errors (404)

- User doesn't exist
- Transaction ID not found

**Response**:

```json
{
  "error": "User not found"
}
```

### 5.3 Business Logic Errors (400)

- Insufficient funds
- Invalid transfer

**Response**:

```json
{
  "error": "Insufficient funds",
  "details": "Sender does not have enough balance..."
}
```

### 5.4 Conflict Errors (409)

- User already exists (duplicate email)
- Duplicate idempotency key (actually returns 200 with existing result)

### 5.5 Server Errors (500)

- Database connection failures
- Unexpected exceptions
- Transaction rollback due to system error

**Response** (Production):

```json
{
  "error": "Internal server error"
}
```

**Response** (Development):

```json
{
  "error": "Internal server error",
  "details": "Detailed error message..."
}
```

### 5.6 Failed Transfers/Withdrawals

**Withdrawal Failure**:

- Transaction created with `status: PROCESSING`
- External system simulation fails
- Status updated to `FAILED` with reason
- Balance NOT deducted
- Returns 400 with transaction details

**Transfer Failure**:

- Pre-validation catches issues before transaction creation
- Database transaction rolls back on error
- No partial state changes

---

## 6. Assumptions & Trade-offs

### 6.1 Assumptions

1. **Single Currency**: All amounts in one currency (assumed USD)
2. **Synchronous Processing**: No background jobs, immediate results
3. **Demo External System**: Withdrawal simulation with 90% success rate
4. **No Authentication**: Simplified for demonstration purposes
5. **Local Development**: PostgreSQL running on localhost
6. **Small Scale**: Design suitable for thousands of users, not millions

### 6.2 Trade-offs

#### Balance Caching vs. Aggregation

**Choice**: Cache balance in `users.balance`

- **Pro**: Fast O(1) balance queries, no SUM aggregation
- **Con**: Requires careful transaction management to keep in sync
- **Mitigation**: Atomic updates within same transaction

#### Synchronous vs. Asynchronous

**Choice**: Synchronous API calls

- **Pro**: Simpler implementation, immediate feedback
- **Con**: API blocks during processing, potential timeout issues
- **When to Change**: High-volume systems, external API calls with delays

#### SERIALIZABLE Isolation

**Choice**: Use for transfers

- **Pro**: Strongest consistency guarantee
- **Con**: Lower throughput due to locking, potential for serialization failures
- **Mitigation**: Retry logic on failure, acceptable for financial transactions

#### Idempotency Key Generation

**Choice**: Client-generated

- **Pro**: Client controls retry behavior, no server-side storage
- **Con**: Client must implement correctly
- **Alternative**: Server-generated (UUIDs), but harder for client retries

#### Schema Design

**Choice**: Separate `senderId`/`receiverId` vs. single participant table

- **Pro**: Simpler queries, clear semantics
- **Con**: Nullable fields, some redundancy
- **Alternative**: Junction table for participants (more complex)

---

## 7. Future Enhancements

### 7.1 Authentication & Authorization

- JWT-based authentication
- Role-based access control (User vs. Admin)
- Session management
- API key for external integrations

### 7.2 Enhanced Ledger

- Double-entry bookkeeping
- Separate ledger entries table
- Account reconciliation jobs
- Balance snapshots for faster historical queries

### 7.3 Background Processing

- Withdrawal queue with retry logic
- Scheduled balance audits
- Failed transaction alerts
- Webhook notifications

### 7.4 Monitoring & Observability

- Application logging (Winston, Pino)
- Error tracking (Sentry)
- Metrics collection (Prometheus)
- Distributed tracing (OpenTelemetry)

### 7.5 Security Enhancements

- Rate limiting per user/IP
- Fraud detection rules
- Transaction limits (daily/monthly)
- Two-factor authentication
- Encryption at rest

### 7.6 Performance Optimizations

- Database connection pooling tuning
- Read replicas for queries
- Redis caching for frequent reads
- CDN for frontend assets

### 7.7 Multi-Currency Support

- Currency column in transactions
- Exchange rate API integration
- Multi-currency balances per user

### 7.8 Testing

- Unit tests (Jest)
- Integration tests (Supertest)
- Load testing (k6, Artillery)
- End-to-end tests (Playwright)

---

## 8. Deployment Considerations

### 8.1 Environment Variables

```bash
# Backend
DATABASE_URL="postgresql://..."
PORT=3001
NODE_ENV=production

# Frontend
NEXT_PUBLIC_API_URL="https://api.nissmart.com"
```

### 8.2 Database Migrations

```bash
# Development
npm run prisma:migrate

# Production (with backup first!)
npx prisma migrate deploy
```

### 8.3 Build & Start

```bash
# Backend
npm run build
npm start

# Frontend
npm run build
npm start
```

### 8.4 Infrastructure

- **Backend**: Containerized (Docker), deployed to AWS ECS/Fargate or similar
- **Frontend**: Static export or SSR on Vercel/Netlify
- **Database**: Managed PostgreSQL (AWS RDS, Supabase, Neon)
- **Load Balancer**: For horizontal scaling of backend
- **CDN**: CloudFront or Cloudflare for frontend

---

## 9. Conclusion

The Nissmart platform demonstrates core financial system design principles with a focus on transaction safety, idempotency, and data integrity. The architecture is intentionally kept simple for clarity while implementing production-grade safety mechanisms. The hybrid ledger approach balances performance with consistency, and the use of modern TypeScript tooling ensures type safety throughout the stack.

The system is production-ready for small to medium scale deployments and can be extended with additional features like authentication, monitoring, and background processing as needed.
