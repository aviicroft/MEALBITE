import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserRole, UserSessionProfile } from "@/types/user";

export function resolveRoleFromPublicMetadata(role: unknown): UserRole {
  return role === "admin" ? "admin" : "student";
}

/**
 * Resolves the application role from the current Clerk user on the server.
 * The live Clerk user object is preferred over session claims so metadata changes
 * are not masked by stale claims.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    const clerkUser = await currentUser();
    const publicMetadataRole = clerkUser?.publicMetadata?.role;
    const resolvedRole = resolveRoleFromPublicMetadata(publicMetadataRole);

    return resolvedRole;
  } catch {
    console.error("Error resolving authenticated user role.");
    return "student";
  }
}

/**
 * Synchronizes the authenticated Clerk user with the local application profile.
 * The persisted role is informational; authorization always uses live Clerk data.
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
  const role = resolveRoleFromPublicMetadata(clerkUser.publicMetadata?.role);

  try {
    const updatedUser = await prisma.user.upsert({
      where: { clerkUserId: userId },
      update: { name, email, role },
      create: {
        clerkUserId: userId,
        name,
        email,
        role,
        studentId: "",
        roomNumber: "",
      },
    });

    return {
      clerkUserId: userId,
      name: updatedUser.name,
      email: updatedUser.email,
      role,
      studentId: updatedUser.studentId,
      roomNumber: updatedUser.roomNumber,
    };
  } catch (error) {
    console.error("Error syncing user with database:", error);
    return {
      clerkUserId: userId,
      name,
      email,
      role,
    };
  }
}

/**
 * Strict server-side role guard for pages and server actions.
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
