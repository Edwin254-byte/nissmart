# Flow Diagrams

This document contains the three critical transaction flows for the Nissmart Micro-Savings Platform.

## 1. Deposit Flow (Simulated Success)

```
┌─────────┐
│  User   │
│Interface│
└────┬────┘
     │
     │ 1. POST /deposit
     │    {userId, amount, idempotencyKey}
     ▼
┌─────────────────┐
│   API Server    │
│  (Controller)   │
└────┬────────────┘
     │
     │ 2. Validate input (Zod schema)
     │    - Check amount > 0
     │    - Validate userId format
     │
     ▼
┌─────────────────┐
│   Check         │
│   Idempotency   │
└────┬────────────┘
     │
     ├─── Key exists? ──> Return existing transaction (200 OK)
     │
     │ 3. Key is unique
     ▼
┌─────────────────────────┐
│  Database Transaction   │
│  (ACID Guaranteed)      │
└────┬────────────────────┘
     │
     │ 4. Lock user record (SELECT)
     │
     ▼
┌─────────────────┐
│  Verify User    │
│  Exists         │
└────┬────────────┘
     │
     │ User not found? ──> 404 Error
     │
     │ 5. User exists
     ▼
┌─────────────────────┐
│  Create Transaction │
│  Record             │
└────┬────────────────┘
     │
     │ 6. INSERT INTO transactions
     │    - type: DEPOSIT
     │    - status: COMPLETED
     │    - amount, idempotencyKey
     │    - receiverId: userId
     │
     ▼
┌─────────────────────┐
│  Update User        │
│  Balance (Ledger)   │
└────┬────────────────┘
     │
     │ 7. UPDATE users
     │    SET balance = balance + amount
     │    WHERE id = userId
     │
     ▼
┌─────────────────────┐
│  Commit Transaction │
└────┬────────────────┘
     │
     │ 8. Return 201 Created
     │    with transaction details
     ▼
┌─────────┐
│  User   │
│Interface│
└─────────┘

** Key Safety Features:**
- Idempotency: Duplicate requests return same result
- Atomic: All steps succeed or all fail
- Balance Update: Single SQL increment operation
- Transaction Record: Immutable audit trail
```

## 2. Internal Transfer Flow

```
┌─────────┐
│ User A  │
│Interface│
└────┬────┘
     │
     │ 1. POST /transfer
     │    {senderId, receiverId, amount, idempotencyKey}
     ▼
┌─────────────────┐
│   API Server    │
│  (Controller)   │
└────┬────────────┘
     │
     │ 2. Validate input
     │    - Check amount > 0
     │    - Validate user IDs
     │    - Ensure senderId ≠ receiverId
     │
     ▼
┌─────────────────┐
│   Check         │
│   Idempotency   │
└────┬────────────┘
     │
     ├─── Key exists? ──> Return existing transaction (200 OK)
     │
     │ 3. Key is unique
     ▼
┌──────────────────────────────┐
│  Database Transaction        │
│  (SERIALIZABLE Isolation)    │
└────┬─────────────────────────┘
     │
     │ 4. Lock BOTH users (ordered by ID)
     │    - Prevents deadlocks
     │    - SELECT ... FOR UPDATE
     │
     ▼
┌─────────────────────────┐
│  Fetch & Verify Users   │
└────┬────────────────────┘
     │
     ├─── User not found? ──> 404 Error
     │
     │ 5. Both users exist
     ▼
┌─────────────────────────┐
│  Check Sender Balance   │
└────┬────────────────────┘
     │
     ├─── balance < amount? ──> 400 Insufficient Funds
     │
     │ 6. Sufficient balance
     ▼
┌─────────────────────────┐
│  Create Transaction     │
│  Record                 │
└────┬────────────────────┘
     │
     │ 7. INSERT INTO transactions
     │    - type: TRANSFER
     │    - status: COMPLETED
     │    - amount, idempotencyKey
     │    - senderId, receiverId
     │
     ▼
┌─────────────────────────┐
│  Deduct from Sender     │
└────┬────────────────────┘
     │
     │ 8. UPDATE users
     │    SET balance = balance - amount
     │    WHERE id = senderId
     │
     ▼
┌─────────────────────────┐
│  Credit to Receiver     │
└────┬────────────────────┘
     │
     │ 9. UPDATE users
     │    SET balance = balance + amount
     │    WHERE id = receiverId
     │
     ▼
┌─────────────────────────┐
│  Commit Transaction     │
└────┬────────────────────┘
     │
     │ 10. Return 201 Created
     │     with transaction details
     ▼
┌─────────┐
│ User A  │
│Interface│
└─────────┘
     │
     │ 11. History updated
     ▼
┌─────────┐
│ User B  │
│ Balance │
│ Updated │
└─────────┘

**Key Safety Features:**
- Idempotency: Duplicate requests safe
- Atomicity: Both balance updates or neither
- No Negative Balances: Pre-check before deduction
- No Double Spending: Row-level locking
- Deadlock Prevention: Ordered locking by user ID
- SERIALIZABLE isolation level
```

## 3. Withdrawal Flow

```
┌─────────┐
│  User   │
│Interface│
└────┬────┘
     │
     │ 1. POST /withdraw
     │    {userId, amount, idempotencyKey}
     ▼
┌─────────────────┐
│   API Server    │
│  (Controller)   │
└────┬────────────┘
     │
     │ 2. Validate input
     │    - Check amount > 0
     │    - Validate userId
     │
     ▼
┌─────────────────┐
│   Check         │
│   Idempotency   │
└────┬────────────┘
     │
     ├─── Key exists? ──> Return existing transaction (200 OK)
     │
     │ 3. Key is unique
     ▼
┌─────────────────────────┐
│  Database Transaction   │
│  (ACID Guaranteed)      │
└────┬────────────────────┘
     │
     │ 4. Lock user record
     │
     ▼
┌─────────────────────────┐
│  Verify User & Balance  │
└────┬────────────────────┘
     │
     ├─── User not found? ──> 404 Error
     ├─── balance < amount? ──> 400 Insufficient Funds
     │
     │ 5. User valid, sufficient balance
     ▼
┌─────────────────────────┐
│  Create Transaction     │
│  Record (PENDING)       │
└────┬────────────────────┘
     │
     │ 6. INSERT INTO transactions
     │    - type: WITHDRAWAL
     │    - status: PROCESSING
     │    - amount, idempotencyKey
     │    - senderId: userId
     │
     ▼
┌─────────────────────────┐
│  Simulate External      │
│  System Processing      │
└────┬────────────────────┘
     │
     │ 7. Random success/failure
     │    (90% success rate in demo)
     │
     ├─────────────────┬──────────────────┐
     │                 │                  │
     │ SUCCESS         │                  │ FAILURE
     ▼                 │                  ▼
┌──────────────────┐  │     ┌──────────────────────┐
│ Update Status to │  │     │ Update Status to     │
│ COMPLETED        │  │     │ FAILED               │
└────┬─────────────┘  │     └────┬─────────────────┘
     │                 │          │
     │ 8a. UPDATE      │          │ 8b. UPDATE
     │     transactions│          │     transactions
     │     SET status= │          │     SET status=FAILED,
     │     COMPLETED   │          │     failureReason=...
     │                 │          │
     ▼                 │          │
┌──────────────────┐  │          │
│ Deduct Balance   │  │          │ (No balance change)
└────┬─────────────┘  │          │
     │                 │          │
     │ 9. UPDATE users │          │
     │    SET balance= │          │
     │    balance -    │          │
     │    amount       │          │
     │                 │          │
     ▼                 │          ▼
┌──────────────────┐  │     ┌──────────────────────┐
│ Commit           │  │     │ Commit               │
│ Transaction      │  │     │ Transaction          │
└────┬─────────────┘  │     └────┬─────────────────┘
     │                 │          │
     │ 10a. Return 201 │          │ 10b. Return 400
     │      (SUCCESS)  │          │      (FAILED)
     │                 │          │
     └─────────────────┴──────────┘
                       │
                       ▼
                 ┌─────────┐
                 │  User   │
                 │Interface│
                 └─────────┘

**Key Safety Features:**
- Idempotency: Duplicate requests safe
- Status Tracking: PROCESSING → COMPLETED/FAILED
- Balance Protection: Only deducted on success
- Atomic: Status and balance updated together
- External System Mock: 90% success simulation
- Failure Tracking: Reason stored for failed withdrawals
- Pre-validation: Check balance before processing
```

## Summary of Safety Mechanisms

### 1. Idempotency

- Every request requires a unique `idempotencyKey`
- Database constraint ensures key uniqueness
- Duplicate requests return the original result
- Client can safely retry on network failures

### 2. Atomicity

- All operations wrapped in database transactions
- Either all changes commit or all rollback
- No partial state changes possible
- ACID guarantees enforced by PostgreSQL

### 3. No Negative Balances

- Balance checked before withdrawal/transfer
- Validation happens inside transaction lock
- Concurrent requests prevented by locking
- Decimal precision prevents rounding errors

### 4. No Double Spending

- Row-level locking with `SELECT FOR UPDATE`
- SERIALIZABLE isolation level for transfers
- Ordered locking (by ID) prevents deadlocks
- Balance updates use atomic increment/decrement

### 5. Request/Response Path

- **Request**: Client → API → Validation → Transaction → Ledger Update
- **Response**: Ledger → Transaction Result → API → Client
- **Error Handling**: Validation errors return 400, not found returns 404
- **Success**: Transaction record + balance update + 201 response
