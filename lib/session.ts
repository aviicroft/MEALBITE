import crypto from "crypto";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const SESSION_COOKIE_NAME = "mealbite_session";
export const SESSION_DURATION_DAYS = 7;
export const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Creates a server-side session in Neon PostgreSQL and sets a secure HTTP-only cookie.
 */
export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const sessionId = crypto.randomUUID();

  // Store in Neon database
  await sql`
    INSERT INTO "Session" (id, token, "userId", "expiresAt", "createdAt")
    VALUES (${sessionId}, ${token}, ${userId}, ${expiresAt.toISOString()}, NOW())
  `;

  // Set HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

/**
 * Invalidates and deletes the current session both from Neon PostgreSQL and the cookie store.
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await sql`DELETE FROM "Session" WHERE token = ${token}`;
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error("Error during session destruction:", error);
  }
}

/**
 * Retrieves the current session token from the HTTP-only cookie.
 */
export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}
