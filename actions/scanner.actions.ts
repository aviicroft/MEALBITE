"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export interface ScanVerificationResult {
  success: boolean;
  message: string;
  error?: string;
  studentName?: string;
  studentId?: string;
  roomNumber?: string;
  mealType?: string;
  menu?: string;
  collectedAt?: string;
  collectedBy?: string;
}

/**
 * Server-side atomic verification and food collection.
 * Protects against double-collection and concurrent scans.
 */
export async function verifyAndCollectQrAction(
  token: string
): Promise<ScanVerificationResult> {
  // 1. Strict Server-Side Admin Authorization
  const adminUser = await requireRole(["admin"]);

  const cleanToken = token.trim();
  if (!cleanToken) {
    return {
      success: false,
      message: "Scan rejected",
      error: "Empty or invalid QR token provided.",
    };
  }

  const wardenName = adminUser?.name || "Hostel Warden";
  const now = new Date();

  // 2. ATOMIC UPDATE: Only update if booking is currently 'BOOKED'
  // In PostgreSQL, UPDATE ... WHERE status = 'BOOKED' RETURNING * guarantees
  // that only ONE concurrent scan can transition the record.
  const updateResult = await sql`
    UPDATE "Booking"
    SET status = 'COLLECTED', "collectedAt" = NOW(), "collectedBy" = ${wardenName}
    WHERE "qrToken" = ${cleanToken} AND status = 'BOOKED'
    RETURNING *
  `;

  // If update succeeded, return successful issuance with student & meal details
  if (updateResult && updateResult.length === 1) {
    const collectedBookings = await sql`
      SELECT b.id, b.status, b."collectedAt", b."collectedBy",
        json_build_object('name', u.name, 'studentId', u."studentId", 'roomNumber', u."roomNumber") as user,
        json_build_object('type', m.type, 'menu', m.menu) as meal
      FROM "Booking" b
      JOIN "User" u ON b."userId" = u.id
      JOIN "Meal" m ON b."mealId" = m.id
      WHERE b."qrToken" = ${cleanToken}
      LIMIT 1
    `;

    const collectedBooking = collectedBookings[0];

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/scanner");
    revalidatePath("/student/dashboard");

    return {
      success: true,
      message: "Food successfully issued! Collection logged.",
      studentName: collectedBooking?.user?.name || "Student",
      studentId: collectedBooking?.user?.studentId || "N/A",
      roomNumber: collectedBooking?.user?.roomNumber || "N/A",
      mealType: collectedBooking?.meal?.type || "Meal",
      menu: collectedBooking?.meal?.menu || "",
      collectedAt: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      collectedBy: wardenName,
    };
  }

  // If update failed (count === 0), determine exact reason to prevent ambiguity
  const existingBookings = await sql`
    SELECT b.id, b.status, b."collectedAt", b."collectedBy",
      json_build_object('name', u.name, 'studentId', u."studentId", 'roomNumber', u."roomNumber") as user,
      json_build_object('type', m.type, 'menu', m.menu) as meal
    FROM "Booking" b
    JOIN "User" u ON b."userId" = u.id
    JOIN "Meal" m ON b."mealId" = m.id
    WHERE b."qrToken" = ${cleanToken}
    LIMIT 1
  `;

  if (!existingBookings || existingBookings.length === 0) {
    return {
      success: false,
      message: "Scan rejected",
      error: "Invalid QR: No booking record matches this code.",
    };
  }

  const existingBooking = existingBookings[0];

  if (existingBooking.status === "COLLECTED") {
    const timeStr = existingBooking.collectedAt
      ? new Date(existingBooking.collectedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "earlier";
    return {
      success: false,
      message: "Double Collection Blocked",
      error: `Booking already collected at ${timeStr} by ${existingBooking.collectedBy || "Warden"}. A pass cannot be used twice.`,
      studentName: existingBooking.user?.name,
      mealType: existingBooking.meal?.type,
    };
  }

  if (existingBooking.status === "CANCELLED") {
    return {
      success: false,
      message: "Scan rejected",
      error: "This meal booking was cancelled by the student or staff.",
      studentName: existingBooking.user?.name,
      mealType: existingBooking.meal?.type,
    };
  }

  if (existingBooking.status === "EXPIRED") {
    return {
      success: false,
      message: "Scan rejected",
      error: "This meal booking has expired.",
      studentName: existingBooking.user?.name,
      mealType: existingBooking.meal?.type,
    };
  }

  return {
    success: false,
    message: "Scan rejected",
    error: `Booking status is currently ${existingBooking.status}. Food cannot be issued.`,
  };
}
