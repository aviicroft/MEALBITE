"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
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
  await requireRole(["admin"]);

  const cleanToken = token.trim();
  if (!cleanToken) {
    return {
      success: false,
      message: "Scan rejected",
      error: "Empty or invalid QR token provided.",
    };
  }

  const user = await currentUser();
  const wardenName =
    user?.fullName || user?.firstName || user?.username || "Hostel Warden";

  const now = new Date();

  // 2. ATOMIC UPDATE: Only update if booking is currently 'BOOKED'
  // This guarantees that even if two wardens scan the exact same QR simultaneously,
  // only ONE database transaction will succeed.
  const updateResult = await prisma.booking.updateMany({
    where: {
      qrToken: cleanToken,
      status: "BOOKED",
    },
    data: {
      status: "COLLECTED",
      collectedAt: now,
      collectedBy: wardenName,
    },
  });

  // If update succeeded, return successful issuance with student & meal details
  if (updateResult.count === 1) {
    const collectedBooking = await prisma.booking.findUnique({
      where: { qrToken: cleanToken },
      include: {
        user: true,
        meal: true,
      },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/scanner");
    revalidatePath("/student/dashboard");

    return {
      success: true,
      message: "Food successfully issued! Collection logged.",
      studentName: collectedBooking?.user.name || "Student",
      studentId: collectedBooking?.user.studentId || "N/A",
      roomNumber: collectedBooking?.user.roomNumber || "N/A",
      mealType: collectedBooking?.meal.type || "Meal",
      menu: collectedBooking?.meal.menu || "",
      collectedAt: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      collectedBy: wardenName,
    };
  }

  // If update failed (count === 0), determine exact reason to prevent ambiguity
  const existingBooking = await prisma.booking.findUnique({
    where: { qrToken: cleanToken },
    include: {
      user: true,
      meal: true,
    },
  });

  if (!existingBooking) {
    return {
      success: false,
      message: "Scan rejected",
      error: "Invalid QR: No booking record matches this code.",
    };
  }

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
      studentName: existingBooking.user.name,
      mealType: existingBooking.meal.type,
    };
  }

  if (existingBooking.status === "CANCELLED") {
    return {
      success: false,
      message: "Scan rejected",
      error: "This meal booking was cancelled by the student or staff.",
      studentName: existingBooking.user.name,
      mealType: existingBooking.meal.type,
    };
  }

  if (existingBooking.status === "EXPIRED") {
    return {
      success: false,
      message: "Scan rejected",
      error: "This meal booking has expired.",
      studentName: existingBooking.user.name,
      mealType: existingBooking.meal.type,
    };
  }

  return {
    success: false,
    message: "Scan rejected",
    error: `Booking status is currently ${existingBooking.status}. Food cannot be issued.`,
  };
}
