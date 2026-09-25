"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { getCurrentUser } from "@/lib/auth";

// Basic in-memory rate limiting to protect against brute-force attacks
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (!attempt) return false;

  if (now > attempt.resetAt) {
    loginAttempts.delete(key);
    return false;
  }

  return attempt.count >= 5;
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const attempt = loginAttempts.get(key);

  if (!attempt || now > attempt.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    attempt.count += 1;
  }
}

function clearAttempts(key: string): void {
  loginAttempts.delete(key);
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
  role?: string;
}

/**
 * Handles user registration with input validation, password hashing, and session creation.
 * Role is strictly assigned as STUDENT on the server.
 */
export async function registerAction(data: {
  name: string;
  email: string;
  password: string;
  studentId?: string;
  roomNumber?: string;
}): Promise<AuthActionResult> {
  try {
    const name = data.name?.trim();
    const email = data.email?.trim().toLowerCase();
    const password = data.password;
    const studentId = data.studentId?.trim() || null;
    const roomNumber = data.roomNumber?.trim() || null;

    // 1. Validation
    if (!name || name.length < 2) {
      return { success: false, error: "Name must be at least 2 characters long." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return { success: false, error: "Please provide a valid email address." };
    }

    if (!password || password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    // 2. Uniqueness checks
    const existingUsers = await sql`
      SELECT id FROM "User" WHERE email = ${email} LIMIT 1
    `;

    if (existingUsers && existingUsers.length > 0) {
      return {
        success: false,
        error: "An account with this email address already exists.",
      };
    }

    if (studentId) {
      const existingStudents = await sql`
        SELECT id FROM "User" WHERE "studentId" = ${studentId} LIMIT 1
      `;
      if (existingStudents && existingStudents.length > 0) {
        return {
          success: false,
          error: "This Student ID is already registered to another account.",
        };
      }
    }

    // 3. Hash password (bcrypt)
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    // 4. Create user - strictly assign role STUDENT
    await sql`
      INSERT INTO "User" (id, name, email, "passwordHash", "studentId", "roomNumber", role, "createdAt", "updatedAt")
      VALUES (${userId}, ${name}, ${email}, ${passwordHash}, ${studentId}, ${roomNumber}, 'STUDENT', NOW(), NOW())
    `;

    // 5. Establish secure session
    await createSession(userId);

    return {
      success: true,
      role: "STUDENT",
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "An unexpected error occurred during registration. Please try again.",
    };
  }
}

/**
 * Handles user login with password verification, rate-limiting, and session creation.
 */
export async function loginAction(data: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  try {
    const email = data.email?.trim().toLowerCase();
    const password = data.password;

    if (!email || !password) {
      return {
        success: false,
        error: "Please enter both your email and password.",
      };
    }

    // Check rate limit
    if (isRateLimited(email)) {
      return {
        success: false,
        error: "Too many failed login attempts. Please wait 15 minutes before trying again.",
      };
    }

    // Look up user
    const users = await sql`
      SELECT id, name, email, "passwordHash", role FROM "User" WHERE email = ${email} LIMIT 1
    `;

    if (!users || users.length === 0) {
      recordFailedAttempt(email);
      // Generic failure message to prevent user enumeration
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    const user = users[0];

    // Verify password hash
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      recordFailedAttempt(email);
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    // Success: clear rate limit
    clearAttempts(email);

    // Create session
    await createSession(user.id);

    const normalizedRole =
      user.role?.toUpperCase() === "ADMIN" ? "ADMIN" : "STUDENT";

    return {
      success: true,
      role: normalizedRole,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "An unexpected error occurred during login. Please try again.",
    };
  }
}

/**
 * Handles user logout by invalidating the session in the database and deleting the cookie.
 */
export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

/**
 * Checks session status for client callers if needed.
 */
export async function getSessionStatusAction() {
  const user = await getCurrentUser();
  return {
    isAuthenticated: !!user,
    user: user || null,
  };
}
