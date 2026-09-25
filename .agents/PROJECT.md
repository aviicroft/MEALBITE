# Project Overview: Hostel MealBite

## Overview
Hostel Food Delivery Tracking and QR Food Collection System migrated to Next.js 16 (App Router), TypeScript, Prisma ORM, Neon PostgreSQL, and Custom Server-Side Authentication.

## Key Architectural Decisions
1. **Database:** Neon PostgreSQL accessed via Prisma ORM.
2. **Authentication:** Custom authentication with bcryptjs password hashing and secure HTTP-only sessions (`mealbite_session`).
3. **Roles:** `STUDENT` and `ADMIN`. Admin creation via secure CLI `npm run create-admin`. Public registration only creates `STUDENT` accounts.
4. **Features Preserved:**
   - Real-time delivery tracking state machine (`PREPARING` → `DISPATCHED` → `ON_THE_WAY` → `ARRIVED`, with `DELAYED` branch)
   - Food availability toggle (`AVAILABLE` / `FINISHED`)
   - Opaque QR token generation and pass display
   - Double-collection prevention via atomic Prisma `updateMany`
   - Role-based route protection
