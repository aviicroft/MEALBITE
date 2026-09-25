"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { IMeal, MealAvailability, MealType } from "@/types/delivery";

export async function createMealAction(formData: {
  date: string;
  type: MealType;
  menu: string;
  bookingOpen: string;
  bookingClose: string;
  targetHostel?: string;
}) {
  const user = await requireRole(["admin"]);

  const mealDate = new Date(formData.date);
  const openDate = new Date(formData.bookingOpen);
  const closeDate = new Date(formData.bookingClose);

  if (isNaN(mealDate.getTime()) || isNaN(openDate.getTime()) || isNaN(closeDate.getTime())) {
    throw new Error("Invalid date/time provided for meal session");
  }

  if (openDate >= closeDate) {
    throw new Error("Booking open time must be earlier than booking close time");
  }

  const mealId = crypto.randomUUID();
  const newMeals = await sql`
    INSERT INTO "Meal" (id, date, type, menu, availability, "bookingOpen", "bookingClose", "createdAt")
    VALUES (${mealId}, ${mealDate.toISOString()}, ${formData.type}, ${formData.menu.trim()}, 'AVAILABLE', ${openDate.toISOString()}, ${closeDate.toISOString()}, NOW())
    RETURNING *
  `;
  const newMeal = newMeals[0];

  // Calculate default delivery expected time
  const defaultDeliveryArrival = new Date(mealDate);
  if (formData.type === "BREAKFAST") {
    defaultDeliveryArrival.setHours(8, 0, 0, 0);
  } else if (formData.type === "LUNCH") {
    defaultDeliveryArrival.setHours(13, 0, 0, 0);
  } else if (formData.type === "SNACKS") {
    defaultDeliveryArrival.setHours(17, 30, 0, 0);
  } else {
    defaultDeliveryArrival.setHours(20, 15, 0, 0);
  }

  // Automatically create a corresponding Delivery record linked to this meal
  const deliveryId = crypto.randomUUID();
  await sql`
    INSERT INTO "Delivery" (
      id, "mealId", "mealType", "deliveryDate", "targetHostel", status,
      "expectedArrivalTime", "isDelayed", "delayReason", notes, "updatedBy", "createdAt", "updatedAt"
    )
    VALUES (
      ${deliveryId}, ${newMeal.id}, ${formData.type}, ${mealDate.toISOString()},
      ${formData.targetHostel || "All Hostels (Block A, B, C)"}, 'PREPARING',
      ${defaultDeliveryArrival.toISOString()}, false, '',
      ${`Fresh ${formData.type.toLowerCase()} service: ${formData.menu.slice(0, 60)}...`},
      ${user.name || user.email}, NOW(), NOW()
    )
  `;

  // Create in-app announcement
  const notifId = crypto.randomUUID();
  await sql`
    INSERT INTO "Notification" (id, title, message, type, "mealType", "createdAt")
    VALUES (
      ${notifId},
      ${`New ${formData.type} Available for Booking`},
      ${`Menu: ${formData.menu.trim()}. Booking closes at ${closeDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`},
      'BOOKING_ALERT',
      ${formData.type},
      NOW()
    )
  `;

  revalidatePath("/admin/meals");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/deliveries");
  revalidatePath("/student/book");
  revalidatePath("/student/dashboard");

  return { success: true, meal: newMeal };
}

export async function getAdminMealsAction(): Promise<IMeal[]> {
  await requireRole(["admin"]);

  try {
    const meals = await sql`
      SELECT m.id, m.date, m.type, m.menu, m.availability, m."bookingOpen", m."bookingClose", m."createdAt",
        (SELECT COUNT(*)::int FROM "Booking" b WHERE b."mealId" = m.id) as booking_count
      FROM "Meal" m
      ORDER BY m.date DESC
      LIMIT 20
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return meals.map((meal: any) => ({
      id: meal.id,
      date: new Date(meal.date),
      type: meal.type,
      menu: meal.menu,
      availability: meal.availability,
      bookingOpen: new Date(meal.bookingOpen),
      bookingClose: new Date(meal.bookingClose),
      createdAt: new Date(meal.createdAt),
      _count: { bookings: meal.booking_count || 0 },
    }));
  } catch (error) {
    console.error("Error fetching admin meals:", error);
    return [];
  }
}

export async function updateMealAvailabilityAction(
  mealId: string,
  availability: MealAvailability
) {
  await requireRole(["admin"]);

  if (!mealId.trim() || !["AVAILABLE", "FINISHED"].includes(availability)) {
    throw new Error("Invalid meal availability update");
  }

  await sql`
    UPDATE "Meal"
    SET availability = ${availability}
    WHERE id = ${mealId}
  `;

  revalidatePath("/admin/meals");
  revalidatePath("/admin/bookings");
  revalidatePath("/student/book");
  revalidatePath("/student/dashboard");

  return { success: true, availability };
}

export async function getMealBookingsAction(mealId: string) {
  await requireRole(["admin"]);

  try {
    const bookings = await sql`
      SELECT b.id, b."userId", b."mealId", b.status, b."qrToken", b."bookedAt", b."collectedAt", b."collectedBy",
        json_build_object('name', u.name, 'email', u.email, 'studentId', u."studentId", 'roomNumber', u."roomNumber") as user,
        json_build_object('id', m.id, 'type', m.type, 'menu', m.menu, 'date', m.date, 'availability', m.availability) as meal
      FROM "Booking" b
      JOIN "User" u ON b."userId" = u.id
      JOIN "Meal" m ON b."mealId" = m.id
      WHERE b."mealId" = ${mealId}
      ORDER BY b."bookedAt" DESC
    `;

    return JSON.parse(JSON.stringify(bookings));
  } catch (error) {
    console.error("Error fetching meal bookings:", error);
    return [];
  }
}
