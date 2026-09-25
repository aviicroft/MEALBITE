# Database Rules & Prisma Specifications

## 1. Database Paradigm

- **Engine:** Neon PostgreSQL (Cloud serverless relational PostgreSQL)
- **Object-Relational Mapping (ORM):** Prisma Client (`@prisma/client`)
- **Connection Variable:** `DATABASE_URL="postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require"`
- **Strict Prohibition:** SQLite, MongoDB, Mongoose, MySQL, Firebase, Supabase, and Flask are strictly prohibited.
- **Client Security:** No database calls or Prisma client access permitted from client-side components (`'use client'`). All database operations must execute inside Server Actions or Route Handlers. Sensitive fields like `passwordHash` must never be sent to the client.

---

## 2. Reusable Prisma Client Singleton (`lib/prisma.ts`)

In Next.js development mode, hot-reloading can instantiate duplicate Prisma clients, leading to connection exhaustion. The client singleton is cached globally:

```typescript
import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
```

---

## 3. Data Models Specification (`prisma/schema.prisma`)

The application defines 6 core models:

### 3.1 `User` Model
Stores student and warden profiles with securely hashed credentials.
- `id` (String, cuid primary key)
- `name` (String)
- `email` (String, unique indexed)
- `passwordHash` (String, bcrypt salted hash, never returned to client)
- `studentId` (String, optional, unique indexed)
- `roomNumber` (String, optional)
- `role` (String, default: "STUDENT", "STUDENT" | "ADMIN")
- `createdAt`, `updatedAt` (DateTime)
- Relations: `bookings`, `sessions`

### 3.2 `Session` Model
Stores secure server-side sessions for authenticated users.
- `id` (String, cuid primary key)
- `token` (String, unique indexed 256-bit cryptographically secure token)
- `userId` (String, foreign key to `User`)
- `expiresAt` (DateTime, session expiration timestamp)
- `createdAt` (DateTime)
- Relations: `user`

### 3.3 `Meal` Model
Represents scheduled mess meals (Breakfast, Lunch, Snacks, Dinner) with defined booking cutoffs.
- `id` (String, primary key)
- `date` (DateTime)
- `type` (String: `BREAKFAST` | `LUNCH` | `SNACKS` | `DINNER`)
- `menu` (String)
- `availability` (String: `AVAILABLE` | `FINISHED`, default: `AVAILABLE`)
- `bookingOpen` (DateTime)
- `bookingClose` (DateTime)
- Relations: `bookings`, `deliveries`

### 3.4 `Booking` Model
Represents a student's booked meal pass and collection state.
- `id` (String, primary key)
- `userId` (String, foreign key to `User`)
- `mealId` (String, foreign key to `Meal`)
- `qrToken` (String, unique, 48-char opaque hex string)
- `status` (String: `BOOKED` | `COLLECTED` | `CANCELLED` | `EXPIRED`, default: `BOOKED`)
- `bookedAt` (DateTime, default: `now()`)
- `collectedAt` (DateTime, optional)
- `collectedBy` (String, optional - name/email of warden)
- **Constraint:** `@@unique([userId, mealId])` (strictly prevents duplicate bookings by a student for the same meal).
- **Index:** `@@index([qrToken])`, `@@index([status])`.

### 3.5 `Delivery` Model
Represents real-time hostel catering delivery sessions.
- `id` (String, primary key)
- `mealId` (String, optional, foreign key to `Meal`)
- `mealType` (String: `BREAKFAST` | `LUNCH` | `SNACKS` | `DINNER`)
- `deliveryDate` (DateTime)
- `targetHostel` (String, default: "All Hostels")
- `status` (String: `PREPARING` | `DISPATCHED` | `ON_THE_WAY` | `ARRIVED` | `DELAYED`)
- `dispatchTime` (DateTime, optional)
- `expectedArrivalTime` (DateTime)
- `actualArrivalTime` (DateTime, optional)
- `isDelayed` (Boolean, default: false)
- `delayReason` (String, default: "")
- `notes` (String, default: "")
- `updatedBy` (String, default: "admin")
- `createdAt`, `updatedAt` (DateTime)

### 3.6 `Notification` Model
Broadcasts in-app status updates and delay announcements.
- `id` (String, primary key)
- `title` (String)
- `message` (String)
- `type` (String: `STATUS_UPDATE` | `DELAY_ALERT` | `ARRIVAL` | `BOOKING_ALERT`)
- `mealType` (String, optional)
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
