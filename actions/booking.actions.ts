"use server";

import crypto from "crypto";
import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { IMeal, IBooking } from "@/types/delivery";

/**
 * Seed default meals and delivery if database has none
 */
export async function seedDefaultMealsIfEmpty() {
  try {
    const mealCountRows = await sql`SELECT COUNT(*)::int as count FROM "Meal"`;
    if (mealCountRows[0]?.count > 0) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Meal 1: Dinner today (Open for booking)
    const dinnerOpen = new Date(today.getTime() + 10 * 3600 * 1000); // 10:00 AM
    const dinnerClose = new Date(today.getTime() + 19 * 3600 * 1000); // 7:00 PM
    if (now > dinnerClose) {
      dinnerClose.setHours(23, 59, 59);
    }

    const dinnerMealId = crypto.randomUUID();
    await sql`
      INSERT INTO "Meal" (id, date, type, menu, availability, "bookingOpen", "bookingClose", "createdAt")
      VALUES (${dinnerMealId}, ${today.toISOString()}, 'DINNER', 'Paneer Butter Masala, Butter Naan, Jeera Rice, Dal Tadka, Gulab Jamun', 'AVAILABLE', ${dinnerOpen.toISOString()}, ${dinnerClose.toISOString()}, NOW())
    `;

    // Create linked active delivery
    const dinnerDeliveryId = crypto.randomUUID();
    await sql`
      INSERT INTO "Delivery" (id, "mealId", "mealType", "deliveryDate", "targetHostel", status, "dispatchTime", "expectedArrivalTime", "isDelayed", "delayReason", notes, "updatedBy", "createdAt", "updatedAt")
      VALUES (${dinnerDeliveryId}, ${dinnerMealId}, 'DINNER', ${today.toISOString()}, 'All Hostels (Block A, B, C)', 'DISPATCHED', ${new Date(today.getTime() + 19.5 * 3600 * 1000).toISOString()}, ${new Date(today.getTime() + 20.25 * 3600 * 1000).toISOString()}, false, '', 'Van #2 dispatched with insulated containers.', 'system', NOW(), NOW())
    `;

    // Meal 2: Lunch today (Closed / Collected demo)
    const lunchOpen = new Date(today.getTime() + 6 * 3600 * 1000);
    const lunchClose = new Date(today.getTime() + 11.5 * 3600 * 1000);
    const lunchMealId = crypto.randomUUID();

    await sql`
      INSERT INTO "Meal" (id, date, type, menu, availability, "bookingOpen", "bookingClose", "createdAt")
      VALUES (${lunchMealId}, ${today.toISOString()}, 'LUNCH', 'Rajma Chawal, Mixed Veg Curry, Phulka, Curd, Boondi Raita', 'AVAILABLE', ${lunchOpen.toISOString()}, ${lunchClose.toISOString()}, NOW())
    `;

    const lunchDeliveryId = crypto.randomUUID();
    await sql`
      INSERT INTO "Delivery" (id, "mealId", "mealType", "deliveryDate", "targetHostel", status, "dispatchTime", "expectedArrivalTime", "actualArrivalTime", "isDelayed", "delayReason", notes, "updatedBy", "createdAt", "updatedAt")
      VALUES (${lunchDeliveryId}, ${lunchMealId}, 'LUNCH', ${today.toISOString()}, 'All Hostels (Block A, B, C)', 'ARRIVED', ${new Date(today.getTime() + 12.5 * 3600 * 1000).toISOString()}, ${new Date(today.getTime() + 13.0 * 3600 * 1000).toISOString()}, ${new Date(today.getTime() + 13.08 * 3600 * 1000).toISOString()}, false, '', 'Delivered promptly at common counter.', 'system', NOW(), NOW())
    `;

    // Default Notification
    const notifId = crypto.randomUUID();
    await sql`
      INSERT INTO "Notification" (id, title, message, type, "mealType", "createdAt")
      VALUES (${notifId}, 'Dinner Meal Booking Open', 'Dinner booking is open! Menu: Paneer Butter Masala & Butter Naan. Book your QR pass now.', 'BOOKING_ALERT', 'DINNER', NOW())
    `;
  } catch (error) {
    console.error("Error seeding default meals:", error);
  }
}

/**
 * Fetch meals available for booking
 */
export async function getAvailableMealsAction(): Promise<IMeal[]> {
  try {
    await seedDefaultMealsIfEmpty();

    const user = await getCurrentUser();
    const userId = user?.id || null;

    const meals = await sql`
      SELECT m.id, m.date, m.type, m.menu, m.availability, m."bookingOpen", m."bookingClose", m."createdAt",
        (SELECT COUNT(*)::int FROM "Booking" b WHERE b."mealId" = m.id) as booking_count,
        (SELECT json_build_object('id', b.id, 'status', b.status, 'qrToken', b."qrToken")
         FROM "Booking" b
         WHERE b."mealId" = m.id AND b."userId" = ${userId}
         LIMIT 1) as user_booking
      FROM "Meal" m
      ORDER BY m.date ASC
      LIMIT 10
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return meals.map((meal: any) => {
      const userBooking = meal.user_booking;
      return {
        id: meal.id,
        date: new Date(meal.date),
        type: meal.type,
        menu: meal.menu,
        availability: meal.availability === "FINISHED" ? "FINISHED" : "AVAILABLE",
        bookingOpen: new Date(meal.bookingOpen),
        bookingClose: new Date(meal.bookingClose),
        createdAt: new Date(meal.createdAt),
        _count: { bookings: meal.booking_count || 0 },
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
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  const meals = await sql`
    SELECT id, date, type, menu, availability, "bookingOpen", "bookingClose"
    FROM "Meal"
    WHERE id = ${mealId}
    LIMIT 1
  `;

  if (!meals || meals.length === 0) throw new Error("Meal session not found");
  const meal = meals[0];

  const now = new Date();

  if (meal.availability !== "AVAILABLE") {
    throw new Error("Food is finished. No new bookings are being accepted.");
  }

  const bookingOpen = new Date(meal.bookingOpen);
  const bookingClose = new Date(meal.bookingClose);

  // Validate booking window
  if (now < bookingOpen) {
    throw new Error(
      `Booking for this meal opens at ${bookingOpen.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
    );
  }

  if (now > bookingClose) {
    throw new Error(
      `Booking closed at ${bookingClose.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
    );
  }

  // Check duplicate booking
  const existing = await sql`
    SELECT id FROM "Booking"
    WHERE "userId" = ${user.id} AND "mealId" = ${meal.id}
    LIMIT 1
  `;

  if (existing && existing.length > 0) {
    throw new Error("You have already booked this meal. Check your active QR Pass.");
  }

  // Generate cryptographically secure, opaque random QR token (no personal info inside)
  const qrToken = crypto.randomBytes(24).toString("hex");
  const bookingId = crypto.randomUUID();

  const newBookings = await sql`
    INSERT INTO "Booking" (id, "userId", "mealId", status, "qrToken", "bookedAt")
    VALUES (${bookingId}, ${user.id}, ${meal.id}, 'BOOKED', ${qrToken}, NOW())
    RETURNING *
  `;

  const booking = newBookings[0];
  booking.meal = meal;

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
    const user = await getCurrentUser();
    if (!user) return [];

    const bookings = await sql`
      SELECT b.id, b."userId", b."mealId", b.status, b."qrToken", b."bookedAt", b."collectedAt", b."collectedBy",
             json_build_object('id', m.id, 'type', m.type, 'menu', m.menu, 'date', m.date, 'availability', m.availability) as meal
      FROM "Booking" b
      JOIN "Meal" m ON b."mealId" = m.id
      WHERE b."userId" = ${user.id} AND b.status = 'BOOKED'
      ORDER BY b."bookedAt" DESC
    `;

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
    const user = await getCurrentUser();
    if (!user) return [];

    const bookings = await sql`
      SELECT b.id, b."userId", b."mealId", b.status, b."qrToken", b."bookedAt", b."collectedAt", b."collectedBy",
             json_build_object('id', m.id, 'type', m.type, 'menu', m.menu, 'date', m.date, 'availability', m.availability) as meal
      FROM "Booking" b
      JOIN "Meal" m ON b."mealId" = m.id
      WHERE b."userId" = ${user.id}
      ORDER BY b."bookedAt" DESC
    `;

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
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  const bookings = await sql`
    SELECT b.id, b."userId", b."mealId", b.status, b."qrToken", b."bookedAt", b."collectedAt", b."collectedBy",
           json_build_object('id', m.id, 'type', m.type, 'menu', m.menu, 'date', m.date, 'availability', m.availability) as meal,
           json_build_object('name', u.name, 'email', u.email, 'studentId', u."studentId", 'roomNumber', u."roomNumber") as user
    FROM "Booking" b
    JOIN "Meal" m ON b."mealId" = m.id
    JOIN "User" u ON b."userId" = u.id
    WHERE b.id = ${bookingId}
    LIMIT 1
  `;

  if (!bookings || bookings.length === 0) throw new Error("Booking pass not found");
  const booking = bookings[0];

  // Only the booked student or an admin can view this pass
  const isAdmin = user.role === "ADMIN";
  if (!isAdmin && booking.userId !== user.id) {
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
