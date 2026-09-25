import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getSessionToken, destroySession } from "@/lib/session";
import { UserRole, UserSessionProfile } from "@/types/user";

/**
 * Resolves the authenticated user from the active HTTP-only session cookie.
 * Passwords and sensitive internal fields are strictly omitted.
 */
export async function getCurrentUser(): Promise<UserSessionProfile | null> {
  try {
    const token = await getSessionToken();
    if (!token) return null;

    const rows = await sql`
      SELECT s.token, s."expiresAt",
             u.id, u.name, u.email, u.role, u."studentId", u."roomNumber"
      FROM "Session" s
      JOIN "User" u ON s."userId" = u.id
      WHERE s.token = ${token}
      LIMIT 1
    `;

    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    const expiresAt = new Date(row.expiresAt);

    // Check session expiration
    if (expiresAt < new Date()) {
      await destroySession();
      return null;
    }

    const role = (
      row.role?.toUpperCase() === "ADMIN" ? "ADMIN" : "STUDENT"
    ) as "STUDENT" | "ADMIN";

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role,
      studentId: row.studentId,
      roomNumber: row.roomNumber,
    };
  } catch (error: unknown) {
    const err = error as { digest?: string; message?: string };
    if (
      err?.digest === "DYNAMIC_SERVER_USAGE" ||
      err?.message?.includes("Dynamic server usage")
    ) {
      throw error;
    }
    console.error("Error retrieving current user:", error);
    return null;
  }
}

/**
 * Ensures the request is from an authenticated user.
 * Redirects to /login if unauthenticated.
 */
export async function requireAuth(): Promise<UserSessionProfile> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Ensures the request is from an authenticated administrator (Warden/Admin).
 * Redirects to /unauthorized if the user is not an admin.
 */
export async function requireAdmin(): Promise<UserSessionProfile> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    redirect("/unauthorized");
  }
  return user;
}

/**
 * Strict server-side role guard for server actions and mutations.
 * Throws errors instead of redirecting so calling actions can handle errors gracefully.
 */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<UserSessionProfile> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
  if (!normalizedAllowed.includes(user.role.toUpperCase())) {
    throw new Error("FORBIDDEN");
  }

  return user;
}

/**
 * Resolves the application role of the current session user.
 */
export async function getCurrentUserRole(): Promise<"STUDENT" | "ADMIN" | null> {
  const user = await getCurrentUser();
  return user ? user.role : null;
}

/**
 * Backward compatibility alias for existing callers.
 */
export async function syncCurrentUser(): Promise<UserSessionProfile | null> {
  return getCurrentUser();
}
