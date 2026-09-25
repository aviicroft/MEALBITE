# Hostel Food Delivery & QR Food Collection System

A modern, full-stack, mobile-first web application designed for university and college residential hostels. It combines two core campus food operations into a single platform:
1. **Live Hostel Food Delivery Tracking:** Allows students to track meal catering deliveries in real-time from the central kitchen to the hostel gate with milestone timelines and instant delay alerts.
2. **Food Booking & QR Collection:** Allows students to pre-book daily meals, receive secure, opaque QR passes, and collect meals at the mess counter while providing wardens with an in-browser camera scanner with atomic double-collection protection.

---

## 1. Key Features

### For Students
- **Daily Meal Booking:** Browse daily menus (Breakfast, Lunch, Dinner) and book meals within active booking windows (`/student/book`).
- **Cryptographic QR Food Pass:** Receive an opaque QR pass (`/student/pass/[id]`) that contains zero personal data and displays live collection status.
- **Active Passes & History:** View active tokens and historical collection records with timestamps (`/student/bookings`).
- **Live Delivery Tracking:** Follow catering vehicle progress along the delivery lifecycle (`PREPARING` → `DISPATCHED` → `ON_THE_WAY` → `ARRIVED`) (`/student/dashboard`).
- **Delay Broadcasts:** Immediate in-app alerts when deliveries are delayed with warden-provided explanations.
- **Delivery Punctuality Log:** Filterable historical delivery logs (`/student/history`).

### For Wardens & Mess Administrators
- **In-Browser QR Scanner:** Fast, camera-driven QR code scanner (`html5-qrcode`) with manual fallback to scan student meal passes (`/admin/scanner`).
- **Atomic Double-Collection Guard:** Concurrent-safe verification that rejects duplicate scans with the exact previous collection timestamp.
- **Meal Schedule Manager:** Create meals with custom menus and booking cutoff windows (`/admin/meals`).
- **Booking Overview:** Live view of all bookings, collected meals, and pending collections (`/admin/bookings`).
- **Delivery Control Console:** Create and update catering delivery runs along the finite state machine (`/admin/deliveries`).
- **Unified KPI Dashboard:** High-level metrics for today's meals, bookings, collections, and active deliveries (`/admin/dashboard`).

---

## 2. Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) 16 (App Router with Turbopack & React Server Components)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict mode enabled)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4
- **Database:** [SQLite](https://www.sqlite.org/) (Embedded local database at `prisma/dev.db`)
- **ORM:** [Prisma](https://www.prisma.io/) v6
- **Authentication:** [Clerk](https://clerk.com/) (session management and server-side public metadata role authorization)
- **QR Code Engine:** `qrcode` (SVG/Canvas generation) and `html5-qrcode` (camera scanning)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 3. Database Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String     @id @default(cuid())
  clerkUserId  String     @unique
  name         String
  email        String     @unique
  studentId    String?
  roomNumber   String?
  role         String     @default("student") // "student" | "admin"
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  bookings     Booking[]
  createdMeals Meal[]     @relation("MealCreator")
}

model Meal {
  id           String     @id @default(cuid())
  date         DateTime
  type         String     // "BREAKFAST" | "LUNCH" | "DINNER"
  menu         String
  bookingOpen  DateTime
  bookingClose DateTime
  createdAt    DateTime   @default(now())
  createdById  String?
  createdBy    User?      @relation("MealCreator", fields: [createdById], references: [id])
  bookings     Booking[]
}

model Booking {
  id          String    @id @default(cuid())
  userId      String
  mealId      String
  qrToken     String    @unique
  status      String    @default("BOOKED") // "BOOKED" | "COLLECTED" | "CANCELLED"
  bookingTime DateTime  @default(now())
  collectedAt DateTime?
  collectedBy String?
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  meal        Meal      @relation(fields: [mealId], references: [id], onDelete: Cascade)

  @@unique([userId, mealId])
  @@index([qrToken])
  @@index([status])
}

model Delivery {
  id                  String         @id @default(cuid())
  mealType            String         // "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER"
  date                DateTime
  targetHostel        String         @default("All Hostels")
  status              String         @default("PREPARING") // "PREPARING" | "DISPATCHED" | "ON_THE_WAY" | "ARRIVED" | "DELAYED"
  dispatchTime        DateTime?
  expectedArrivalTime DateTime
  actualArrivalTime   DateTime?
  isDelayed           Boolean        @default(false)
  delayReason         String?
  notes               String?
  createdByClerkId    String
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
  notifications       Notification[]
}

model Notification {
  id         String    @id @default(cuid())
  title      String
  message    String
  type       String    @default("STATUS_UPDATE") // "STATUS_UPDATE" | "DELAY_ALERT" | "ARRIVAL"
  deliveryId String?
  delivery   Delivery? @relation(fields: [deliveryId], references: [id], onDelete: Cascade)
  createdAt  DateTime  @default(now())
}
```

---

## 4. Environment Variables

Create a `.env` (or `.env.local`) file in the project root:

```env
# Database: Local SQLite file
DATABASE_URL="file:./dev.db"

# Clerk Authentication (from https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk URL Routing
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/student/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/student/dashboard
```

---

## 5. Quickstart & Installation

```bash
# 1. Install dependencies
npm install

# 2. Push schema to SQLite database (generates prisma/dev.db)
npx prisma db push

# 3. Set the Clerk user's public metadata to { "role": "admin" } for admin access.

# 4. Run automated test suites
npm test

# 5. Start development server
npm run dev

# 6. Build and start production bundle
npm run build
npm start
```

## Vercel Deployment

1. Import the repository into Vercel and keep the framework preset as **Next.js**.
2. Configure these Vercel environment variables for the Production environment:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `DATABASE_URL`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/student/dashboard`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/student/dashboard`
3. Use production Clerk keys (`pk_live_...` and `sk_live_...`) in Vercel, not the local development keys. Add the Vercel deployment URL to Clerk's allowed origins/redirect settings.
4. Set the administrator's Clerk public metadata to `{ "role": "admin" }`. The application reads this value from Clerk's server-side user object; missing or invalid values resolve to `student`.
5. Set `DATABASE_URL` to a persistent hosted database URL before production use. The current SQLite file configuration (`file:./dev.db`) is local filesystem storage and is not persistent across Vercel deployments/functions.
6. Deploy after `npm install`, `npx prisma generate`, and `npm run build` pass locally.

### SQLite production limitation

Do not use `DATABASE_URL=file:./dev.db` for a production Vercel deployment. Vercel's serverless filesystem is ephemeral, so SQLite writes can disappear between deployments or function instances and cannot provide reliable shared application storage. The application still uses SQLite locally as required; production should migrate Prisma to a persistent hosted database such as Neon Postgres, Supabase Postgres, or another Prisma-supported managed provider before launch.

---

## 6. Key Application Routes

### Student Routes
| Route | Description |
| --- | --- |
| `/student/dashboard` | Main student hub: live catering delivery status, delay alerts, active meal passes. |
| `/student/book` | Daily meal booking interface with countdown timers and menu details. |
| `/student/pass/[id]` | High-resolution QR food pass with live collection status. |
| `/student/bookings` | Active and past booking passes with statuses. |
| `/student/history` | Historical meal delivery arrival logs with search filters. |

### Admin & Warden Routes
| Route | Description |
| --- | --- |
| `/admin/dashboard` | Unified operational KPIs (meals, bookings, collections, deliveries). |
| `/admin/scanner` | In-browser QR camera scanner with manual fallback and double-collection guard. |
| `/admin/meals` | Daily meal scheduling and booking cutoff management. |
| `/admin/bookings` | Comprehensive table of student bookings and collection timestamps. |
| `/admin/deliveries` | Catering delivery session manager with state machine transition controls. |
| `/admin/history` | Chronological delivery audit logs. |

---

## 7. How QR Verification Works

1. **Student Books Meal:** A cryptographically random 48-char opaque token is generated server-side. Zero student personal data is stored in the QR code.
2. **Student Arrives at Mess:** Student shows the QR pass on their phone at `/student/pass/[id]`.
3. **Warden Scans Pass:** Warden points device camera at student's screen using `/admin/scanner`.
4. **Atomic Collection:** Server runs `prisma.booking.updateMany({ where: { qrToken, status: 'BOOKED' }, data: { status: 'COLLECTED' } })`.
   - **First Scan:** Updates 1 row. Warden gets a green confirmation with student details. Student pass updates to "SUCCESS: Food Collected".
   - **Subsequent Scan:** Updates 0 rows. Warden immediately receives a red alert indicating the meal was already collected along with the original collection time and warden name.

---

## 8. Verification & Testing

The system includes a complete automated test suite verifying both SQLite Prisma operations and the delivery state machine:

```bash
npx tsx test/prisma-system.test.ts
```

Tests cover:
- User creation and role assignments (`student` vs `admin`)
- Meal creation and booking window constraints
- Duplicate booking prevention (`@@unique([userId, mealId])`)
- Opaque 48-character QR token generation
- Successful atomic meal collection
- Immediate rejection of double-collection attempts
- Delivery state machine progression (`PREPARING` → `DISPATCHED` → `ON_THE_WAY` → `ARRIVED`)
- Delivery delay handling and notifications
