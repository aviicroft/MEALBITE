"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserRole, requireRole } from "@/lib/auth";
import { IMeal, MealAvailability, MealType } from "@/types/delivery";

export async function createMealAction(formData: {
  date: string;
  type: MealType;
  menu: string;
  bookingOpen: string;
  bookingClose: string;
  targetHostel?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");

  const role = await getCurrentUserRole();
  if (role !== "admin") throw new Error("UNAUTHORIZED_ADMIN_ONLY");

  const mealDate = new Date(formData.date);
  const openDate = new Date(formData.bookingOpen);
  const closeDate = new Date(formData.bookingClose);

  if (isNaN(mealDate.getTime()) || isNaN(openDate.getTime()) || isNaN(closeDate.getTime())) {
    throw new Error("Invalid date/time provided for meal session");
  }

  if (openDate >= closeDate) {
    throw new Error("Booking open time must be earlier than booking close time");
  }

  // Create Meal in Prisma
  const newMeal = await prisma.meal.create({
    data: {
      date: mealDate,
      type: formData.type,
      menu: formData.menu.trim(),
      bookingOpen: openDate,
      bookingClose: closeDate,
    },
  });

  // Calculate default delivery expected time (1 hour after booking close or around meal time)
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
  await prisma.delivery.create({
    data: {
      mealId: newMeal.id,
      mealType: formData.type,
      deliveryDate: mealDate,
      targetHostel: formData.targetHostel || "All Hostels (Block A, B, C)",
      status: "PREPARING",
      expectedArrivalTime: defaultDeliveryArrival,
      isDelayed: false,
      delayReason: "",
      notes: `Fresh ${formData.type.toLowerCase()} service: ${formData.menu.slice(0, 60)}...`,
      updatedBy: userId,
    },
  });

  // Create in-app announcement
  await prisma.notification.create({
    data: {
      title: `New ${formData.type} Available for Booking`,
      message: `Menu: ${formData.menu.trim()}. Booking closes at ${closeDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      type: "BOOKING_ALERT",
      mealType: formData.type,
    },
  });

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
    const meals = await prisma.meal.findMany({
      orderBy: { date: "desc" },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
      take: 20,
    });

    return JSON.parse(JSON.stringify(meals));
  } catch (error) {
    console.error("Error fetching admin meals:", error);
    return [];
  }
}

export async function updateMealAvailabilityAction(
  mealId: string,
  availability: MealAvailability
) {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");

  const role = await getCurrentUserRole();
  if (role !== "admin") throw new Error("UNAUTHORIZED_ADMIN_ONLY");

  if (!mealId.trim() || !["AVAILABLE", "FINISHED"].includes(availability)) {
    throw new Error("Invalid meal availability update");
  }

  await prisma.meal.update({
    where: { id: mealId },
    data: { availability },
  });

  revalidatePath("/admin/meals");
  revalidatePath("/admin/bookings");
  revalidatePath("/student/book");
  revalidatePath("/student/dashboard");

  return { success: true, availability };
}

export async function getMealBookingsAction(mealId: string) {
  await requireRole(["admin"]);

  try {
    const bookings = await prisma.booking.findMany({
      where: { mealId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            studentId: true,
            roomNumber: true,
          },
        },
        meal: true,
      },
      orderBy: { bookedAt: "desc" },
    });

    return JSON.parse(JSON.stringify(bookings));
  } catch (error) {
    console.error("Error fetching meal bookings:", error);
    return [];
  }
}
