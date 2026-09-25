# Database Rules & Prisma Specifications

## 1. Database Paradigm

- **Engine:** SQLite (Relational embedded database)
- **File Location:** `prisma/dev.db`
- **Object-Relational Mapping (ORM):** Prisma Client (`@prisma/client`)
- **Connection Variable:** `DATABASE_URL="file:./dev.db"`
- **Strict Prohibition:** MongoDB, Mongoose, MySQL, PostgreSQL, Firebase, Supabase, and Flask are strictly prohibited.
- **Client Security:** No database calls or Prisma client access permitted from client-side components (`'use client'`). All database operations must execute inside Server Actions or Route Handlers.

---

## 2. Reusable Prisma Client Singleton (`lib/prisma.ts`)

In Next.js development mode, hot-reloading can instantiate duplicate Prisma clients, leading to file locking or connection exhaustion on SQLite. The client singleton is cached globally:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## 3. Data Models Specification (`prisma/schema.prisma`)

The application defines 5 core models:

### 3.1 `User` Model
Stores student and warden profiles synced with Clerk. **Never store passwords or auth tokens in this table.**
- `id` (String, cuid/uuid primary key)
- `clerkUserId` (String, unique indexed)
- `name` (String)
- `email` (String, unique indexed)
- `studentId` (String, optional)
- `roomNumber` (String, optional)
- `role` (String, default: "student")
- `createdAt`, `updatedAt` (DateTime)
- Relations: `bookings`, `createdMeals`

### 3.2 `Meal` Model
Represents scheduled mess meals (Breakfast, Lunch, Dinner) with defined booking cutoffs.
- `id` (String, primary key)
- `date` (DateTime)
- `type` (String: `BREAKFAST` | `LUNCH` | `DINNER`)
- `menu` (String)
- `bookingOpen` (DateTime)
- `bookingClose` (DateTime)
- `createdById` (String, optional)
- Relations: `bookings`, `createdBy`

### 3.3 `Booking` Model
Represents a student's booked meal pass and collection state.
- `id` (String, primary key)
- `userId` (String, foreign key to `User`)
- `mealId` (String, foreign key to `Meal`)
- `qrToken` (String, unique, 48-char opaque hex string)
- `status` (String: `BOOKED` | `COLLECTED` | `CANCELLED`, default: `BOOKED`)
- `bookingTime` (DateTime, default: `now()`)
- `collectedAt` (DateTime, optional)
- `collectedBy` (String, optional - name/email of warden)
- **Constraint:** `@@unique([userId, mealId])` (strictly prevents duplicate bookings by a student for the same meal).
- **Index:** `@@index([qrToken])`, `@@index([status])`.

### 3.4 `Delivery` Model
Represents real-time hostel catering delivery sessions.
- `id` (String, primary key)
- `mealType` (String: `BREAKFAST` | `LUNCH` | `SNACKS` | `DINNER`)
- `date` (DateTime)
- `targetHostel` (String, default: "All Hostels")
- `status` (String: `PREPARING` | `DISPATCHED` | `ON_THE_WAY` | `ARRIVED` | `DELAYED`)
- `dispatchTime` (DateTime, optional)
- `expectedArrivalTime` (DateTime)
- `actualArrivalTime` (DateTime, optional)
- `isDelayed` (Boolean, default: false)
- `delayReason` (String, optional)
- `notes` (String, optional)
- `createdByClerkId` (String)
- `createdAt`, `updatedAt` (DateTime)
- Relations: `notifications`

### 3.5 `Notification` Model
Broadcasts in-app status updates and delay announcements.
- `id` (String, primary key)
- `title` (String)
- `message` (String)
- `type` (String: `STATUS_UPDATE` | `DELAY_ALERT` | `ARRIVAL`)
- `deliveryId` (String, optional, foreign key to `Delivery`)
- `createdAt` (DateTime, default: `now()`)

---

## 4. Query Rules & Atomic Safety

1. **Double-Collection Atomic Protection:**
   Warden QR scans must NEVER perform a read-then-write pattern that leaves room for a race condition. Always execute:
   ```typescript
   const res = await prisma.booking.updateMany({
     where: { qrToken, status: 'BOOKED' },
     data: { status: 'COLLECTED', collectedAt: new Date(), collectedBy: wardenName },
   });
   ```
   Check `res.count === 1` for first-time collection; reject if `res.count === 0`.
2. **Duplicate Booking Prevention:**
   Rely on `@@unique([userId, mealId])` on the database level, and check `bookingOpen <= now <= bookingClose` in the server action before creating.
3. **No Raw Queries:**
   Always use Prisma Client type-safe queries. Never concatenate SQL strings.
4. **Relational Includes:**
   Always specify `include: { user: true, meal: true }` when retrieving bookings to provide complete context in admin/student passes.
