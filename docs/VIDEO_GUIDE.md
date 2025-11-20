# Video Walkthrough Guide (2-5 Minutes)

This guide will help you create a professional video demonstration of the Nissmart platform.

## Pre-Recording Checklist

- [ ] Backend server running (`cd backend && npm run dev`)
- [ ] Frontend server running (`cd ui && npm run dev`)
- [ ] PostgreSQL database running
- [ ] Fresh database (or reset with demo data)
- [ ] Browser ready at http://localhost:3000
- [ ] Swagger docs tab open at http://localhost:3001/api-docs
- [ ] Screen recording software ready (QuickTime, OBS, Loom, etc.)

## Video Structure (5 Minutes Max)

### 1. Introduction (30 seconds)

**What to Say:**

> "Hi, I'm [Your Name]. This is my submission for the Nissmart Full-Stack Developer assignment. I've built a micro-savings and payout platform with a focus on transaction safety and idempotency. Let me walk you through the key features."

**What to Show:**

- Home page at http://localhost:3000
- Point out User Portal and Admin Dashboard cards

---

### 2. User Portal Demo (2 minutes)

#### Create Users (30 seconds)

**Actions:**

1. Click "User Portal"
2. Click "New User"
3. Create first user: Alice Smith, alice@example.com
4. Create second user: Bob Johnson, bob@example.com

**What to Say:**

> "First, let's create two test users. The system validates email uniqueness and stores users in PostgreSQL."

#### Deposit Flow (30 seconds)

**Actions:**

1. Select Alice
2. Click "Deposit"
3. Enter $1000
4. Submit
5. Show balance update

**What to Say:**

> "Alice deposits $1000. This creates a transaction record and atomically updates her balance. Notice the idempotency key ensures duplicate requests won't double-charge."

#### Transfer Flow (40 seconds)

**Actions:**

1. With Alice selected, click "Transfer"
2. Select Bob as recipient
3. Enter $300
4. Submit
5. Show Alice's new balance ($700)
6. Go back, select Bob
7. Show Bob's balance ($300)

**What to Say:**

> "Now Alice transfers $300 to Bob. This uses a SERIALIZABLE database transaction with row-level locking to prevent double-spending. Notice both balances update atomically—either both change or neither does."

#### Withdrawal Flow (20 seconds)

**Actions:**

1. Select Alice
2. Click "Withdraw"
3. Enter $100
4. Submit
5. Show result (success or failure)

**What to Say:**

> "Withdrawals simulate an external system with a 90% success rate. The transaction status tracks PROCESSING, then COMPLETED or FAILED. Balance only updates on success."

---

### 3. Admin Dashboard (1 minute)

**Actions:**

1. Go back to home
2. Click "Admin Dashboard"
3. Show metrics:
   - Total Users
   - Total Wallet Value
   - Transaction counts
4. Scroll through transactions table
5. Point out transaction details (ID, type, status, amount, users, timestamp)

**What to Say:**

> "The admin dashboard provides real-time system monitoring. We see 2 users, total wallet value of $900, and all recent transactions. Each transaction has a unique ID, type, status, and full audit trail. This table shows the last 50 transactions across all users."

---

### 4. API Documentation (45 seconds)

**Actions:**

1. Switch to Swagger UI tab (http://localhost:3001/api-docs)
2. Expand a few endpoints:
   - POST /api/users
   - POST /api/deposit
   - POST /api/transfer
3. Show the schema definitions

**What to Say:**

> "All endpoints are documented with Swagger. We have user management, transaction endpoints for deposit, transfer, and withdrawal, plus admin statistics. Each endpoint includes request validation, idempotency support, and proper error handling."

---

### 5. Architecture Highlights (30 seconds)

**Actions:**

1. Open VS Code or file explorer
2. Show project structure briefly:
   - backend folder (Express API)
   - ui folder (Next.js)
   - docs folder (architecture, flow diagrams)
3. Open docs/flow-diagrams.md briefly

**What to Say:**

> "The architecture is clean and modular. Backend uses Express with TypeScript and Prisma ORM. Frontend is Next.js 14 with App Router. I've included comprehensive documentation: architecture document explaining all design decisions, and flow diagrams for the three critical transaction types showing safety mechanisms like idempotency, atomicity, and balance protection."

---

### 6. Safety Features Recap (30 seconds)

**What to Say (over any screen):**

> "Key safety features implemented:
>
> - Idempotency keys prevent duplicate transactions
> - Atomic database transactions ensure consistency
> - Row-level locking prevents double-spending
> - Balance validation prevents negative balances
> - SERIALIZABLE isolation for transfers
> - Complete audit trail in transaction history
>
> The system is production-ready with PostgreSQL, includes full documentation, and all requirements from the assignment brief are implemented. Thank you for your consideration!"

---

## Recording Tips

### Technical Setup

- **Resolution**: 1080p minimum
- **Frame Rate**: 30fps
- **Audio**: Clear voice, minimal background noise
- **Browser Zoom**: 100% or 125% for visibility

### Screen Recording Tools

- **macOS**: QuickTime (free), ScreenFlow (paid)
- **Windows**: OBS Studio (free), Camtasia (paid)
- **Cross-platform**: Loom (free tier), Zoom recording

### Presentation Tips

1. **Practice Once**: Do a dry run to time yourself
2. **Speak Clearly**: Moderate pace, not too fast
3. **Show, Don't Tell**: Let actions speak
4. **Stay Focused**: Stick to the script above
5. **Handle Errors**: If something fails (like withdrawal), explain it's intentional

### What to Avoid

- Don't rush through features
- Don't spend time on installation (already done)
- Don't apologize for UI design (it's functional)
- Don't go over 5 minutes

## Alternative: Shorter 2-Minute Version

If you need a condensed version:

**Structure:**

1. Introduction (15s)
2. Quick user creation + deposit (30s)
3. Transfer demo (30s)
4. Admin dashboard (30s)
5. Architecture mention + closing (15s)

## Upload Checklist

After recording:

- [ ] Video is 2-5 minutes long
- [ ] Audio is clear and audible
- [ ] All key features demonstrated
- [ ] Upload to YouTube/Vimeo/Loom
- [ ] Set to "Unlisted" or "Public"
- [ ] Add video link to README.md
- [ ] Test the link works

## Video Link Location

Add to the top of your README.md:

```markdown
## 📹 Video Walkthrough

**[Watch the 5-minute demo →](YOUR_VIDEO_LINK_HERE)**

This video demonstrates all key features including user management, deposits, transfers, withdrawals, and the admin dashboard.
```

---

**Good luck with your recording!** 🎥 Keep it confident, concise, and showcase your work!
