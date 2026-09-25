# System Architecture: Hostel Food Delivery & QR Food Collection System

## 1. Architectural Overview

The Hostel Food Delivery & QR Food Collection System is a unified, full-stack monolith powered by the **Next.js 16 App Router** with **TypeScript** and **Tailwind CSS**. It combines two mission-critical campus operations:
1. **Live Hostel Food Delivery Tracking:** Enforced finite state machine (`PREPARING` → `DISPATCHED` → `ON_THE_WAY` → `ARRIVED`, with `DELAYED` branch) with delay alerts and historical punctuality logs.
2. **Food Booking & QR Collection:** Meal booking with time windows, duplicate booking prevention, opaque cryptographically generated QR passes, and atomic warden camera scanning with double-collection protection.

```mermaid
graph TD
    Client[Browser / Mobile Client] --> Middleware[Clerk Route Guard Middleware]
    Middleware --> AppRouter[Next.js App Router]
    
    subgraph Client & UI Layer
        StudentPortal[Student Portal: /student/*<br>- Live Tracker<br>- Book Meals<br>- QR Passes]
        AdminPortal[Admin Portal: /admin/*<br>- Live Delivery Console<br>- QR Camera Scanner<br>- Meal Scheduler]
        PublicLanding[Landing / Auth Pages]
    end
    
    subgraph Server & Application Services
        RoleGuard[Server Role Guard: lib/auth.ts]
        MealActions[Meal Actions: actions/meal.actions.ts]
        BookingActions[Booking Actions: actions/booking.actions.ts]
        ScannerActions[Scanner Actions: actions/scanner.actions.ts]
        DeliveryActions[Delivery Actions: actions/delivery.actions.ts]
    end
    
    subgraph Data Layer
        PrismaClient[Prisma Client: lib/prisma.ts]
        SQLite[(SQLite Database: prisma/dev.db)]
    end
    
    AppRouter --> StudentPortal
    AppRouter --> AdminPortal
    AppRouter --> PublicLanding
    
    StudentPortal --> BookingActions
    StudentPortal --> DeliveryActions
    AdminPortal --> MealActions
    AdminPortal --> ScannerActions
    AdminPortal --> DeliveryActions
    
    MealActions --> RoleGuard
    BookingActions --> RoleGuard
    ScannerActions --> RoleGuard
    DeliveryActions --> RoleGuard
    
    RoleGuard --> PrismaClient
    PrismaClient --> SQLite
```

---

## 2. Directory Structure

```text
CAT-WEB/
├── .agents/                    # Agent persistent memory & operational rules
│   ├── README.md
│   ├── PROJECT_CONTEXT.md
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT_RULES.md
│   ├── DATABASE_RULES.md
│   ├── UI_RULES.md
│   └── PROGRESS.md
├── actions/                    # Next.js Server Actions (all mutations & data fetching)
│   ├── booking.actions.ts      # Meal booking, passes, student history, auto-seeding
│   ├── delivery.actions.ts     # Delivery state machine, live tracking, stats, alerts
│   ├── meal.actions.ts         # Admin meal creation, schedule management
│   └── scanner.actions.ts      # Atomic QR verification & food collection
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Clerk authentication routes
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── admin/                  # Protected Warden / Admin Management
│   │   ├── bookings/page.tsx   # All bookings & real-time collection status
│   │   ├── dashboard/page.tsx  # Unified KPI dashboard (bookings + deliveries)
│   │   ├── deliveries/page.tsx # Active delivery state machine controls
│   │   ├── history/page.tsx    # Filterable delivery audit log
│   │   ├── layout.tsx          # Server-side role guard (blocks student role)
│   │   ├── meals/page.tsx      # Daily meal & booking window management
│   │   └── scanner/page.tsx    # In-browser QR camera scanner + manual input
│   ├── api/                    # Route Handlers
│   │   └── health/route.ts     # Health check & SQLite database ping
│   ├── student/                # Protected Student Portal
│   │   ├── book/page.tsx       # Daily meal booking view with countdown
│   │   ├── bookings/page.tsx   # Active meal passes & past booking history
│   │   ├── dashboard/page.tsx  # Live delivery tracker, active passes, delay banners
│   │   ├── history/page.tsx    # Delivery punctuality history
│   │   ├── layout.tsx          # Student base layout
│   │   └── pass/[id]/page.tsx  # Individual QR food collection pass
│   ├── error.tsx               # Client error boundary
│   ├── globals.css             # Tailwind CSS styles
│   ├── layout.tsx              # Root HTML & ClerkProvider
│   ├── loading.tsx             # Global loading skeleton
│   ├── not-found.tsx           # 404 page
│   ├── page.tsx                # Landing & role-based redirector
│   └── unauthorized/page.tsx   # Access forbidden handler
├── components/                 # Reusable UI Components
│   ├── admin/                  # CreateDeliveryModal, DeliveryControlCard, QrScanner, CreateMealModal
│   ├── booking/                # MealBookingButton
│   ├── delivery/               # DelayAlertBanner, DeliveryTimeline, DeliveryHistoryTable
│   ├── layout/                 # Navbar, MobileNav
│   └── ui/                     # Button, Card, Badge
├── lib/                        # Core Utilities & Singletons
│   ├── auth.ts                 # Server-side Clerk role resolution & user sync
│   ├── constants.ts            # Enums, statuses, default values
│   ├── prisma.ts               # PrismaClient connection singleton
│   └── utils.ts                # cn helper, date & time formatters
├── prisma/                     # Database Schema & SQLite File
│   ├── dev.db                  # Local SQLite database file
│   └── schema.prisma           # Prisma schema (User, Meal, Booking, Delivery, Notification)
├── scripts/                    # Maintenance & Setup Scripts
│   └── make-admin.ts           # Admin elevation CLI script
├── test/                       # Verification Test Suites
│   └── prisma-system.test.ts   # 16 automated tests verifying models, QR, transitions
├── types/                      # TypeScript Definitions
│   ├── delivery.ts             # Meal, Booking, Delivery, Status enums & interfaces
│   ├── index.ts                # Consolidated re-exports
│   └── user.ts                 # UserRole & IUser definitions
├── middleware.ts               # Clerk route protection middleware
├── package.json
└── tsconfig.json               # Strict TypeScript config
```

---

## 3. QR Food Collection & Double-Collection Protection

### 3.1 Opaque QR Token Generation
When a student books a meal, an opaque cryptographically random 48-character hex token is generated server-side using `crypto.randomBytes(24).toString('hex')`.
- **Zero Student PII in QR:** The QR payload does not expose student ID, room number, or email.
- **Pass URL & Token:** The QR renders either the verification URL or the raw token, which the warden scans.

### 3.2 Double-Collection Prevention Mechanism
To guarantee that a meal cannot be collected multiple times—even under rapid or concurrent scanning—the collection handler uses an atomic database update:

```typescript
const updateResult = await prisma.booking.updateMany({
  where: {
    qrToken: trimmedToken,
    status: 'BOOKED',
  },
  data: {
    status: 'COLLECTED',
    collectedAt: new Date(),
    collectedBy: warden.name || warden.email,
  },
});
```

- If `updateResult.count === 1`: The state transition was atomically applied. The response returns **Collection Successful** along with student name, room number, and meal details.
- If `updateResult.count === 0`: The booking either does not exist or has already transitioned to `COLLECTED` or `CANCELLED`. A subsequent query checks the current state and returns an immediate rejection:
  > *"ALREADY COLLECTED: This food pass was already collected on [Timestamp] by [Warden]. Multiple collections are strictly prohibited."*

```mermaid
sequenceDiagram
    autonumber
    actor Student
    actor Warden
    participant Scanner as Warden Scanner (/admin/scanner)
    participant Server as Server Action (verifyAndCollectQrAction)
    participant DB as SQLite (Prisma)

    Student->>Server: bookMealAction(mealId)
    Server->>DB: Check booking window & existing booking
    Server->>DB: prisma.booking.create({ qrToken, status: 'BOOKED' })
    DB-->>Server: Booking record
    Server-->>Student: QR Food Pass (/student/pass/[id])

    Warden->>Scanner: Scan Student QR Pass (html5-qrcode / manual)
    Scanner->>Server: verifyAndCollectQrAction(qrToken)
    Server->>DB: updateMany({ where: { qrToken, status: 'BOOKED' }, data: { status: 'COLLECTED' } })
    alt count == 1 (First Scan)
        DB-->>Server: Success (count = 1)
        Server-->>Scanner: 200 OK: "Food Collected Successfully" (Green)
    else count == 0 (Duplicate Scan or Invalid)
        DB-->>Server: Ignored (count = 0)
        Server->>DB: Query current booking status
        DB-->>Server: Status is already 'COLLECTED'
        Server-->>Scanner: 400 Rejected: "ALREADY COLLECTED at [Timestamp]" (Red)
    end
```

---

## 4. Delivery Status State Machine

The active delivery tracking system maintains its strict finite state machine alongside food bookings:

```mermaid
stateDiagram-v2
    [*] --> PREPARING: Admin creates delivery session
    PREPARING --> DISPATCHED: Kitchen dispatch
    DISPATCHED --> ON_THE_WAY: Transit en route
    ON_THE_WAY --> ARRIVED: Mess arrival (Terminal)
    
    PREPARING --> DELAYED: Prep delay
    DISPATCHED --> DELAYED: Transit delay
    ON_THE_WAY --> DELAYED: Traffic/weather delay
    
    DELAYED --> DISPATCHED: Delay resolved
    DELAYED --> ON_THE_WAY: Resumed transit
    DELAYED --> ARRIVED: Arrived after delay
    
    ARRIVED --> [*]
```

---

## 5. Security & Isolation Principles

1. **Zero Client-Side Trust:** Roles and user IDs are resolved purely on the server through Clerk JWT tokens and verified in `lib/auth.ts`.
2. **Unique Booking Enforcement:** Database level `@@unique([userId, mealId])` guarantees no duplicate bookings can ever be written for the same student on the same meal.
3. **Admin Elevation Guard:** Warden roles are controlled via Clerk user metadata (`{ "role": "admin" }`) or via the verified CLI script `scripts/make-admin.ts`.
