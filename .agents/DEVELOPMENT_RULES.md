# Development Rules & Engineering Standards

All contributors and automated agents must adhere to these 20 development rules for the **Hostel Food Delivery Tracking System**.

---

## The 20 Core Development Rules

1. **TypeScript Strict Mode:** Maintain `"strict": true` in `tsconfig.json`. No implicit `any`, no ignoring unresolved types.
2. **Avoid `any`:** Model explicit interfaces and types. Use `unknown` with type guards if types are truly dynamic.
3. **Component Reusability:** Favor composable, modular components in `components/ui/` rather than inline one-off UI blocks.
4. **No Duplicate Business Logic:** Centralize status transitions, validation logic, and date formatters in `lib/` and `actions/`.
5. **Keep Database Logic Server-Side:** Never import Mongoose models or query databases from Client Components (`'use client'`).
6. **Never Expose MongoDB Credentials:** Connection strings and DB details must never leak into client bundles or public repositories.
7. **Never Expose Clerk Secrets:** `CLERK_SECRET_KEY` must remain strictly server-side. Only `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` may be public.
8. **Validate API & Action Input:** Validate all incoming parameters (e.g., using Zod or explicit schema checks) before modifying database records.
9. **Handle Loading States:** Always implement skeletal loaders or loading spinners for data fetches and button submissions.
10. **Handle Empty States:** Present clean, friendly empty-state illustrations or text when no active deliveries or history entries exist.
11. **Handle Errors Gracefully:** Capture network or database failures, wrap them in user-friendly error messages, and prevent blank screens.
12. **Meaningful Types:** Use descriptive TypeScript type and interface names (e.g., `DeliveryStatus`, `MealType`, `IDeliveryRecord`).
13. **Environment Variables for Secrets:** Read configuration from `process.env`. Validate presence on application startup.
14. **Never Hardcode Credentials:** No tokens, passwords, database URLs, or API keys in source code files.
15. **Maintainable Components:** Keep components focused on a single responsibility; split complex UI into smaller subcomponents.
16. **Mobile-First Responsiveness:** Design and test for small mobile viewports (360px–420px) first, then scale smoothly to desktop screens.
17. **Do Not Rewrite Working Code Unnecessarily:** Enhance or refactor with purpose; avoid breaking working functionality.
18. **Justify All Dependencies:** Do not add third-party packages unless strictly necessary and approved against project constraints.
19. **Preserve Existing Functionality:** When updating UI elements or routes, ensure existing user flows remain fully operational.
20. **Prefer Simple Solutions (No Over-Engineering):** This is an academic and demonstrable project. Do not build unnecessary abstraction layers or premature microservices.

---

## Code Quality Standards

### TypeScript Standards
- Export interfaces and types from `types/`.
- Use discriminated unions for status-dependent states:
  ```typescript
  export type DeliveryStatus = 
    | 'PREPARING' 
    | 'DISPATCHED' 
    | 'ON_THE_WAY' 
    | 'ARRIVED' 
    | 'DELAYED';
  ```

### Server Action Guidelines
- Always authenticate user with Clerk `auth()` at the start of every Server Action.
- Verify role membership before performing administrative mutations:
  ```typescript
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (sessionClaims?.metadata?.role !== 'admin') throw new Error("Forbidden");
  ```
- Return structured responses: `{ success: boolean; data?: T; error?: string }`.
