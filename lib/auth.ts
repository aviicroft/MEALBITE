import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserRole, UserSessionProfile } from "@/types/user";

/**
 * Server-side helper to resolve the authenticated user's role securely.
 * Priority:
 * 1. Clerk session token claims (sessionClaims?.metadata?.role / publicMetadata?.role)
 * 2. Database lookup in SQLite User table (authoritative application profile)
 * Fallback: 'student' if authenticated, null if unauthenticated.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return null;
  }

  // Check claims if metadata was embedded in JWT
  const metadata = (sessionClaims?.metadata || sessionClaims?.publicMetadata) as
    | { role?: string }
    | undefined;

  if (metadata?.role === "admin" || metadata?.role === "student") {
    return metadata.role as UserRole;
  }

  // Database fallback if role is stored in SQLite
  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true },
    });

    if (dbUser?.role === "admin" || dbUser?.role === "student") {
      return dbUser.role as UserRole;
    }
  } catch (error) {
    console.error("Error retrieving user role from database:", error);
  }

  return "student";
}

/**
 * Synchronizes the currently authenticated Clerk user with SQLite User table.
 * Creates a record if it does not exist, or updates name/email if changed.
 */
export async function syncCurrentUser(): Promise<UserSessionProfile | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses[0]?.emailAddress ||
    `${clerkUser.id}@hostel.placeholder`;

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    "Hostel Resident";

  // Check if role is present in Clerk publicMetadata
  const clerkMetadataRole = (clerkUser.publicMetadata?.role as string) || "";
  const initialRole: UserRole =
    clerkMetadataRole === "admin" ? "admin" : "student";

  try {
    const updatedUser = await prisma.user.upsert({
      where: { clerkUserId: userId },
      update: {
        name,
        email,
      },
      create: {
        clerkUserId: userId,
        name,
        email,
        role: initialRole,
        studentId: "",
        roomNumber: "",
      },
    });

    return {
      clerkUserId: userId,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role as UserRole,
      studentId: updatedUser.studentId,
      roomNumber: updatedUser.roomNumber,
    };
  } catch (error) {
    console.error("Error syncing user with database:", error);
    return {
      clerkUserId: userId,
      name,
      email,
      role: initialRole,
    };
  }
}

/**
 * Strict server-side role guard.
 * Call inside Server Actions or Server Component layouts to guarantee user authorization.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<{
  userId: string;
  role: UserRole;
}> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("UNAUTHENTICATED");
  }

  const role = await getCurrentUserRole();

  if (!role || !allowedRoles.includes(role)) {
    throw new Error("FORBIDDEN");
  }

  return { userId, role };
}
