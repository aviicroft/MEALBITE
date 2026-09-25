"use server";

import crypto from "crypto";
import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { syncCurrentUser } from "@/lib/auth";
import { IMeal, IBooking } from "@/types/delivery";

/**
 * Seed default meals and delivery if SQLite database has none
 */
export async function seedDefaultMealsIfEmpty() {
  const mealCount = await prisma.meal.count();
  if (mealCount > 0) return;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Meal 1: Dinner today (Open for booking)
  const dinnerOpen = new Date(today.getTime() + 10 * 3600 * 1000); // 10:00 AM
  const dinnerClose = new Date(today.getTime() + 19 * 3600 * 1000); // 7:00 PM (or later if currently late)
  
  // If current time is past 7 PM, keep it open till 11:30 PM for demo purposes
  if (now > dinnerClose) {
    dinnerClose.setHours(23, 59, 59);
  }

  const dinnerMeal = await prisma.meal.create({
    data: {
      date: today,
      type: "DINNER",
      menu: "Paneer Butter Masala, Butter Naan, Jeera Rice, Dal Tadka, Gulab Jamun",
      bookingOpen: dinnerOpen,
      bookingClose: dinnerClose,
    },
  });

  // Create linked active delivery
  await prisma.delivery.create({
    data: {
      mealId: dinnerMeal.id,
      mealType: "DINNER",
      deliveryDate: today,
      targetHostel: "All Hostels (Block A, B, C)",
      status: "DISPATCHED",
      dispatchTime: new Date(today.getTime() + 19.5 * 3600 * 1000), // 7:30 PM
      expectedArrivalTime: new Date(today.getTime() + 20.25 * 3600 * 1000), // 8:15 PM
      isDelayed: false,
      delayReason: "",
      notes: "Van #2 dispatched with insulated containers.",
      updatedBy: "system",
    },
  });

  // Meal 2: Lunch today (Closed / Collected demo)
  const lunchOpen = new Date(today.getTime() + 6 * 3600 * 1000);
  const lunchClose = new Date(today.getTime() + 11.5 * 3600 * 1000);

  const lunchMeal = await prisma.meal.create({
    data: {
      date: today,
      type: "LUNCH",
      menu: "Rajma Chawal, Mixed Veg Curry, Phulka, Curd, Boondi Raita",
      bookingOpen: lunchOpen,
      bookingClose: lunchClose,
    },
  });

  await prisma.delivery.create({
    data: {
      mealId: lunchMeal.id,
      mealType: "LUNCH",
      deliveryDate: today,
      targetHostel: "All Hostels (Block A, B, C)",
      status: "ARRIVED",
      dispatchTime: new Date(today.getTime() + 12.5 * 3600 * 1000),
      expectedArrivalTime: new Date(today.getTime() + 13.0 * 3600 * 1000),
      actualArrivalTime: new Date(today.getTime() + 13.08 * 3600 * 1000),
      isDelayed: false,
      delayReason: "",
      notes: "Delivered promptly at common counter.",
      updatedBy: "system",
    },
  });

  // Default Notification
  await prisma.notification.create({
    data: {
      title: "Dinner Meal Booking Open",
      message: "Dinner booking is open! Menu: Paneer Butter Masala & Butter Naan. Book your QR pass now.",
      type: "BOOKING_ALERT",
      mealType: "DINNER",
    },
  });
}

/**
 * Fetch meals available for booking
 */
export async function getAvailableMealsAction(): Promise<IMeal[]> {
  try {
    await seedDefaultMealsIfEmpty();

    const { userId } = await auth();
    let currentDbUser = null;
    if (userId) {
      currentDbUser = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    }

    const meals = await prisma.meal.findMany({
      orderBy: { date: "asc" },
      include: {
        _count: {
          select: { bookings: true },
        },
        bookings: currentDbUser
          ? {
              where: { userId: currentDbUser.id },
            }
          : false,
      },
      take: 10,
    });

    return meals.map((meal) => {
      const userBooking = meal.bookings && meal.bookings.length > 0 ? meal.bookings[0] : null;
      return {
        id: meal.id,
        date: meal.date,
        type: meal.type,
        menu: meal.menu,
        bookingOpen: meal.bookingOpen,
        bookingClose: meal.bookingClose,
        createdAt: meal.createdAt,
        _count: meal._count,
        hasBooked: !!userBooking,
        userBooking: userBooking ? JSON.parse(JSON.stringify(userBooking)) : null,
      };
    });
  } catch (error) {
    console.error("Error fetching available meals:", error);
    return [];
  }
}

/**
 * Book a meal for the current student
 */
export async function bookMealAction(mealId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");

  // Ensure user is synced
  await syncCurrentUser();

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User record not found. Please re-login.");

  const meal = await prisma.meal.findUnique({
    where: { id: mealId },
  });

  if (!meal) throw new Error("Meal session not found");

  const now = new Date();

  // Validate booking window
  if (now < meal.bookingOpen) {
    throw new Error(
      `Booking for this meal opens at ${meal.bookingOpen.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
    );
  }

  if (now > meal.bookingClose) {
    throw new Error(
      `Booking closed at ${meal.bookingClose.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
    );
  }

  // Prevent duplicate booking
  const existing = await prisma.booking.findUnique({
    where: {
      userId_mealId: {
        userId: user.id,
        mealId: meal.id,
      },
    },
  });

  if (existing) {
    throw new Error("You have already booked this meal. Check your active QR Pass.");
  }

  // Generate cryptographically secure, opaque random QR token (no personal info inside)
  const qrToken = crypto.randomBytes(24).toString("hex");

  const booking = await prisma.booking.create({
    data: {
      userId: user.id,
      mealId: meal.id,
      status: "BOOKED",
      qrToken,
      bookedAt: now,
    },
    include: {
      meal: true,
    },
  });

  revalidatePath("/student/dashboard");
  revalidatePath("/student/book");
  revalidatePath("/student/bookings");

  return { success: true, booking: JSON.parse(JSON.stringify(booking)) };
}

/**
 * Fetch current user active bookings
 */
export async function getUserActiveBookingsAction(): Promise<IBooking[]> {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) return [];

    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
        status: "BOOKED",
      },
      include: {
        meal: true,
      },
      orderBy: { bookedAt: "desc" },
    });

    return JSON.parse(JSON.stringify(bookings));
  } catch (error) {
    console.error("Error fetching active bookings:", error);
    return [];
  }
}

/**
 * Fetch all user bookings for history
 */
export async function getUserBookingHistoryAction(): Promise<IBooking[]> {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) return [];

    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
      },
      include: {
        meal: true,
      },
      orderBy: { bookedAt: "desc" },
    });

    return JSON.parse(JSON.stringify(bookings));
  } catch (error) {
    console.error("Error fetching booking history:", error);
    return [];
  }
}

/**
 * Fetch single booking and generate QR code image data
 */
export async function getBookingPassAction(bookingId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      meal: true,
      user: {
        select: {
          name: true,
          email: true,
          studentId: true,
          roomNumber: true,
        },
      },
    },
  });

  if (!booking) throw new Error("Booking pass not found");

  // Only the booked student or an admin can view this pass
  if (user?.role !== "admin" && booking.userId !== user?.id) {
    throw new Error("UNAUTHORIZED_PASS_ACCESS");
  }

  // Generate crisp QR code Data URL from the opaque token
  const qrDataUrl = await QRCode.toDataURL(booking.qrToken, {
    width: 280,
    margin: 2,
    color: {
      dark: "#1e1b4b", // Deep indigo
      light: "#ffffff",
    },
  });

  return {
    booking: JSON.parse(JSON.stringify(booking)),
    qrDataUrl,
  };
}
