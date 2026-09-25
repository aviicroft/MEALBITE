# Hostel Food Delivery & QR Food Collection System (MealBite)

A modern, full-stack, mobile-first web application designed for university and college residential hostels. It combines two core campus food operations into a single platform:
1. **Live Hostel Food Delivery Tracking:** Allows students to track meal catering deliveries in real-time from the central kitchen to the hostel gate with milestone timelines and instant delay alerts.
2. **Food Booking & QR Collection:** Allows students to pre-book daily meals, receive secure, opaque QR passes, and collect meals at the mess counter while providing wardens with an in-browser camera scanner with atomic double-collection protection.

---

## 1. Key Features

### For Students
- **Custom Authentication:** Secure registration and login (`/register`, `/login`) with password hashing and HTTP-only session cookies.
- **Daily Meal Booking:** Browse daily menus (Breakfast, Lunch, Snacks, Dinner) and book meals within active booking windows (`/student/book`).
- **Cryptographic QR Food Pass:** Receive an opaque QR pass (`/student/pass/[id]`) that contains zero personal data and displays live collection status.
- **Active Passes & History:** View active tokens and historical collection records with timestamps (`/student/bookings`).
- **Live Delivery Tracking:** Follow catering vehicle progress along the delivery lifecycle (`PREPARING` → `DISPATCHED` → `ON_THE_WAY` → `ARRIVED`) (`/student/dashboard`).
- **Delay Broadcasts:** Immediate in-app alerts when deliveries are delayed with warden-provided explanations.
- **Delivery Punctuality Log:** Filterable historical delivery logs (`/student/history`).

### For Wardens & Mess Administrators
- **Warden Administration:** Secure admin login with server-verified `ADMIN` role.
- **In-Browser QR Scanner:** Fast, camera-driven QR code scanner (`html5-qrcode`) with manual fallback to scan student meal passes (`/admin/scanner`).
- **Atomic Double-Collection Guard:** Concurrent-safe verification that rejects duplicate scans with the exact previous collection timestamp.
- **Meal Schedule & Availability:** Create meals with custom menus, booking cutoff windows, and food availability (`AVAILABLE` / `FINISHED`) (`/admin/meals`).
- **Booking Overview:** Live view of all bookings, collected meals, and pending collections (`/admin/bookings`).
- **Delivery Control Console:** Create and update catering delivery runs along the finite state machine (`/admin/deliveries`).
- **Unified KPI Dashboard:** High-level metrics for today's meals, bookings, collections, and active deliveries (`/admin/dashboard`).

---

## 2. Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) 16 (App Router with Turbopack & React Server Components)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict mode enabled)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4
- **Database:** [Neon PostgreSQL](https://neon.tech/) (Cloud serverless PostgreSQL)
- **ORM:** [Prisma](https://www.prisma.io/) v6
- **Authentication:** Custom server-side authentication (bcryptjs + HTTP-only sessions)
- **QR Code Engine:** `qrcode` (generation) and `html5-qrcode` (camera scanning)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 3. Database Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  passwordHash String
  studentId    String?   @unique
  roomNumber   String?
  role         String    @default("STUDENT") // STUDENT, ADMIN
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  bookings     Booking[]
  sessions     Session[]
}

model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}

model Meal {
  id           String     @id @default(cuid())
  date         DateTime
  type         String     // BREAKFAST, LUNCH, SNACKS, DINNER
  menu         String
  availability String     @default("AVAILABLE") // AVAILABLE, FINISHED
  bookingOpen  DateTime
  bookingClose DateTime
  createdAt    DateTime   @default(now())
  bookings     Booking[]
  deliveries   Delivery[]
}

model Booking {
  id          String    @id @default(cuid())
  userId      String
  mealId      String
  status      String    @default("BOOKED") // BOOKED, COLLECTED, CANCELLED, EXPIRED
  qrToken     String    @unique
  bookedAt    DateTime  @default(now())
  collectedAt DateTime?
  collectedBy String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  meal Meal @relation(fields: [mealId], references: [id], onDelete: Cascade)

  @@unique([userId, mealId])
  @@index([qrToken])
  @@index([status])
}

model Delivery {
  id                  String    @id @default(cuid())
  mealId              String?
  mealType            String    // BREAKFAST, LUNCH, SNACKS, DINNER
  deliveryDate        DateTime
  targetHostel        String    @default("All Hostels")
  status              String    @default("PREPARING") // PREPARING, DISPATCHED, ON_THE_WAY, ARRIVED, DELAYED
  dispatchTime        DateTime?
  expectedArrivalTime DateTime
  actualArrivalTime   DateTime?
  isDelayed           Boolean   @default(false)
  delayReason         String    @default("")
  notes               String    @default("")
  updatedBy           String    @default("admin")
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  meal Meal? @relation(fields: [mealId], references: [id], onDelete: SetNull)
}

model Notification {
  id        String   @id @default(cuid())
  title     String
  message   String
  type      String   @default("STATUS_UPDATE")
  mealType  String?
  createdAt DateTime @default(now())
}
```

---

## 4. Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```env
# Neon PostgreSQL Database Connection URL
# Format: postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require
DATABASE_URL="postgresql://neondb_owner:password@ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Initial Administrator Credentials (used by: npm run create-admin)
ADMIN_EMAIL="admin@hostel.edu"
ADMIN_PASSWORD="SecureAdminPassword123!"

# Session Secret Key
SESSION_SECRET="your-secure-session-secret-random-string-at-least-32-characters"
```

---

## 5. Local Development Setup

### Prerequisites
- Node.js 18+ installed
- A Neon PostgreSQL database (from https://neon.tech)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Set `DATABASE_URL` in `.env` to your Neon PostgreSQL connection string.

### 3. Apply Database Migrations
```bash
npx prisma migrate deploy
# Or apply locally with:
npx prisma db push
```

### 4. Create Initial Administrator Account
```bash
npm run create-admin
```
This script reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env` or prompts interactively.

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Authentication & Roles

### Authentication Flow
- **Registration (`/register`):** Student signs up with Name, Email, Password, Student ID, and Room Number. Passwords are securely hashed with bcrypt. The account is created with `role: "STUDENT"`.
- **Login (`/login`):** Users enter Email and Password. Upon validation, a cryptographically secure random session token is generated, stored in PostgreSQL, and set as an HTTP-only cookie (`mealbite_session`).
- **Logout (`/logout`):** Destroys the session in PostgreSQL and clears the HTTP-only cookie.
- **Server Guard (`lib/auth.ts`):** `getCurrentUser()`, `requireAuth()`, and `requireAdmin()` validate sessions on the server without trusting client claims.

### Application Roles
- **STUDENT:** Can view status, book available meals, view passes, and view history. Blocked from admin routes.
- **ADMIN:** Full mess management: schedule meals, toggle availability, advance deliveries, scan QR passes, and audit bookings.

---

## 7. Production Deployment (Vercel)

1. Connect your repository to Vercel.
2. In the Vercel Project Settings under **Environment Variables**, add:
   - `DATABASE_URL`: Your production Neon PostgreSQL connection string (`?sslmode=require`).
   - `SESSION_SECRET`: A random 32+ character string.
3. Build & Deploy:
   - Build Command: `npm run build`
4. Run `npm run create-admin` or execute migrations via `npx prisma migrate deploy`.
