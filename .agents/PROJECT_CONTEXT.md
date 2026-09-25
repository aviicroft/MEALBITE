# Project Context: Hostel Food Delivery Tracking & QR Collection System

## 1. Executive Summary

- **Project Name:** Hostel Food Delivery Tracking System
- **Project Type:** Full-stack Web Application
- **Domain:** Campus / Hostel Living, Meal Booking & Dining Operations
- **Scope:** Practical, clean, demonstrable academic/production-grade full-stack project

## 2. Core Problem & Value Proposition

In hostel environments, meal deliveries prepared at central kitchens or catering facilities frequently face fluctuating arrival times due to preparation delays, traffic, weather, or distribution bottlenecks. Additionally, mess halls require an orderly, non-duplicable food booking and issuance mechanism so food is prepared to demand and distributed fairly without manual coupon cards or line disputes.

**Solution:** A unified, mobile-first web portal providing:
1. **Real-Time Delivery Tracking:** Wardens update delivery states (`PREPARING` → `DISPATCHED` → `ON_THE_WAY` → `ARRIVED`, with `DELAYED` branch and reason capture), and students track progress live.
2. **Food Booking & QR Pass System:** Students review upcoming meal menus, book meals before cutoff time, receive a secure opaque QR pass, and present it at the counter.
3. **Warden QR Scanner:** Wardens scan passes via browser camera, server verifies booking validity and performs an atomic status update (`BOOKED` → `COLLECTED`), strictly blocking double-collection attempts.

---

## 3. User Roles & Capabilities

### 3.1 Student (`student`)
- **Authentication:** Sign in / sign up via Clerk.
- **Meal Booking:** Browse today's menus, check booking window deadlines, and book meals.
- **Digital QR Pass:** Access personal QR collection pass with meal and booking details.
- **Real-Time Status Dashboard:** View active meal status (`PREPARING`, `DISPATCHED`, `ON_THE_WAY`, `ARRIVED`, `DELAYED`).
- **Delay Visibility:** Immediate alerts when a delivery is marked delayed with reason.
- **History:** View past food bookings and delivery arrival logs.

### 3.2 Admin / Hostel Warden (`admin`)
- **Authentication & Secure Access:** Sign in via Clerk with server-verified role access.
- **QR Scanner:** In-browser camera scanning to verify passes and issue meals with double-collection protection.
- **Meal Management:** Schedule meal menus (Breakfast, Lunch, Snacks, Dinner) and define booking open/close windows.
- **Booking Roster:** Review live lists of booked vs collected meals.
- **Delivery Management:** Advance delivery milestones, log dispatch/arrival timestamps, flag delays with reasons.
- **Audit & History:** Full historical log of bookings and caterer punctuality.

---

## 4. Final Technology Stack

| Layer | Technology | Justification |
| --- | --- | --- |
| **Framework** | **Next.js (App Router)** | Full-stack architecture with React Server Components (RSC) and Turbopack. |
| **Language** | **TypeScript** | Strict type safety across client and server boundaries. |
| **Styling** | **Tailwind CSS** | Clean, responsive, mobile-first design. |
| **Authentication** | **Clerk** | Secure authentication, session management, and server-verifiable user roles. |
| **Database** | **SQLite** | Fast, zero-configuration, embedded relational database (`dev.db`). |
| **ORM** | **Prisma** | Strict type-safe schema, migrations, relations, and atomic transactions. |
| **QR Code** | **qrcode & html5-qrcode**| Cryptographic QR generation and browser-camera scanning. |

---

## 5. Strict Architectural Constraints

- ❌ No Python / Flask / Django
- ❌ No MySQL / PostgreSQL / MongoDB (Migrated to SQLite + Prisma)
- ❌ No Firebase / Supabase
- ❌ No Artificial Intelligence / Machine Learning
- ❌ No Microservices or External Message Brokers
- ❌ No Personal data in QR codes (opaque tokens only)
