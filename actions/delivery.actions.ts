"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { seedDefaultMealsIfEmpty } from "@/actions/booking.actions";
import {
  MealType,
  DeliveryStatus,
  IDelivery,
  DeliveryFilters,
  DashboardStats,
  INotification,
} from "@/types/delivery";

/**
 * Valid state transitions table
 */
const VALID_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  PREPARING: ["DISPATCHED", "DELAYED"],
  DISPATCHED: ["ON_THE_WAY", "DELAYED"],
  ON_THE_WAY: ["ARRIVED", "DELAYED"],
  DELAYED: ["DISPATCHED", "ON_THE_WAY", "ARRIVED"],
  ARRIVED: [], // Terminal state
};

/**
 * Fetch the active/most relevant delivery for the student tracker
 */
export async function getLiveDeliveryAction(): Promise<IDelivery | null> {
  try {
    await seedDefaultMealsIfEmpty();

    // Look for active delivery first
    let active = await prisma.delivery.findFirst({
      where: {
        status: { in: ["PREPARING", "DISPATCHED", "ON_THE_WAY", "DELAYED"] },
      },
      orderBy: [{ deliveryDate: "desc" }, { createdAt: "desc" }],
    });

    // If none active, return the most recent arrived delivery
    if (!active) {
      active = await prisma.delivery.findFirst({
        orderBy: [{ deliveryDate: "desc" }, { createdAt: "desc" }],
      });
    }

    if (!active) return null;

    return {
      ...active,
      _id: active.id,
      status: active.status as DeliveryStatus,
    };
  } catch (error) {
    console.error("Error fetching live delivery:", error);
    return null;
  }
}

/**
 * Fetch delivery history with optional filtering
 */
export async function getDeliveryHistoryAction(
  filters?: DeliveryFilters
): Promise<IDelivery[]> {
  try {
    await seedDefaultMealsIfEmpty();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (filters?.mealType && filters.mealType !== "ALL") {
      where.mealType = filters.mealType;
    }

    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    if (filters?.date) {
      const selected = new Date(filters.date);
      if (!isNaN(selected.getTime())) {
        const startOfDay = new Date(selected.setHours(0, 0, 0, 0));
        const endOfDay = new Date(selected.setHours(23, 59, 59, 999));
        where.deliveryDate = { gte: startOfDay, lte: endOfDay };
      }
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      orderBy: [{ deliveryDate: "desc" }, { createdAt: "desc" }],
    });

    return deliveries.map((d) => ({
      ...d,
      _id: d.id,
      status: d.status as DeliveryStatus,
    }));
  } catch (error) {
    console.error("Error fetching delivery history:", error);
    return [];
  }
}

/**
 * Fetch comprehensive admin dashboard statistics
 */
export async function getAdminDashboardStatsAction(): Promise<DashboardStats> {
  await requireRole(["admin"]);

  try {
    await seedDefaultMealsIfEmpty();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [todayDeliveries, todayMeals, todayBookings] = await Promise.all([
      prisma.delivery.findMany({
        where: {
          deliveryDate: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.meal.findMany({
        where: {
          date: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.booking.findMany({
        where: {
          bookedAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
    ]);

    const todayTotal = todayDeliveries.length;
    const completed = todayDeliveries.filter((d) => d.status === "ARRIVED").length;
    const delayed = todayDeliveries.filter(
      (d) => d.isDelayed || d.status === "DELAYED"
    ).length;
    const pending = todayDeliveries.filter((d) =>
      ["PREPARING", "DISPATCHED", "ON_THE_WAY", "DELAYED"].includes(d.status)
    ).length;

    const collectedCount = todayBookings.filter((b) => b.status === "COLLECTED").length;
    const pendingCollectionCount = todayBookings.filter((b) => b.status === "BOOKED").length;

    return {
      todayTotal,
      completed,
      delayed,
      pending,
      todayMeals: todayMeals.length,
      todayBookings: todayBookings.length,
      collectedCount,
      pendingCollectionCount,
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      todayTotal: 0,
      completed: 0,
      delayed: 0,
      pending: 0,
      todayMeals: 0,
      todayBookings: 0,
      collectedCount: 0,
      pendingCollectionCount: 0,
    };
  }
}

/**
 * Fetch recent delay notices and status announcements
 */
export async function getRecentNotificationsAction(): Promise<INotification[]> {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return notifications.map((n) => ({
      ...n,
      _id: n.id,
      type: n.type as INotification["type"],
    }));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

/**
 * Admin action to create a new delivery session
 */
export async function createDeliveryAction(formData: {
  mealType: MealType;
  deliveryDate: string;
  expectedArrivalTime: string;
  targetHostel?: string;
  notes?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");

  await requireRole(["admin"]);

  const deliveryDate = new Date(formData.deliveryDate || new Date());
  
  // Parse expected arrival time
  const [hours, minutes] = formData.expectedArrivalTime.split(":").map(Number);
  const expectedDate = new Date(deliveryDate);
  if (!isNaN(hours) && !isNaN(minutes)) {
    expectedDate.setHours(hours, minutes, 0, 0);
  } else {
    expectedDate.setHours(expectedDate.getHours() + 1);
  }

  const newDelivery = await prisma.delivery.create({
    data: {
      mealType: formData.mealType,
      deliveryDate,
      expectedArrivalTime: expectedDate,
      targetHostel: formData.targetHostel || "All Hostels (Block A, B, C)",
      notes: formData.notes || "",
      status: "PREPARING",
      isDelayed: false,
      delayReason: "",
      updatedBy: userId,
    },
  });

  // Post in-app announcement
  await prisma.notification.create({
    data: {
      title: `${formData.mealType} Delivery Scheduled`,
      message: `${formData.mealType} session initialized. Expected arrival ~ ${expectedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      type: "STATUS_UPDATE",
      mealType: formData.mealType,
    },
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/deliveries");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/history");

  return {
    success: true,
    delivery: { ...newDelivery, _id: newDelivery.id },
  };
}

/**
 * Admin action to update delivery status & lifecycle
 */
export async function updateDeliveryStatusAction(
  deliveryId: string,
  newStatus: DeliveryStatus,
  delayReason?: string,
  note?: string
) {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");

  await requireRole(["admin"]);

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
  });

  if (!delivery) throw new Error("Delivery record not found");

  const oldStatus = delivery.status as DeliveryStatus;

  // Validate state machine progression
  const allowedNext = VALID_TRANSITIONS[oldStatus] || [];
  if (oldStatus !== newStatus && !allowedNext.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${oldStatus} to ${newStatus}. Allowed: ${allowedNext.join(", ")}`
    );
  }

  // Automated timestamp and field management
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    status: newStatus,
    updatedBy: userId,
  };

  if (newStatus === "DISPATCHED" && !delivery.dispatchTime) {
    updateData.dispatchTime = new Date();
  } else if (newStatus === "ARRIVED") {
    updateData.actualArrivalTime = new Date();
    updateData.isDelayed = false; // Reset active delay flag once arrived
  } else if (newStatus === "DELAYED") {
    updateData.isDelayed = true;
    if (delayReason) {
      updateData.delayReason = delayReason.trim();
    }
  }

  if (note) {
    updateData.notes = note.trim();
  }

  const updatedDelivery = await prisma.delivery.update({
    where: { id: deliveryId },
    data: updateData,
  });

  // Post Notification for students
  let notifTitle = `${delivery.mealType} Delivery Updated`;
  let notifMessage = `Status changed to ${newStatus}.`;
  let notifType: "STATUS_UPDATE" | "DELAY_ALERT" | "ARRIVAL" = "STATUS_UPDATE";

  if (newStatus === "DELAYED") {
    notifType = "DELAY_ALERT";
    notifTitle = `⚠️ ${delivery.mealType} Delivery Delayed`;
    notifMessage = delayReason
      ? `Today's ${delivery.mealType.toLowerCase()} delivery is delayed: ${delayReason}`
      : `Today's ${delivery.mealType.toLowerCase()} delivery is experiencing a delay.`;
  } else if (newStatus === "ARRIVED") {
    notifType = "ARRIVAL";
    notifTitle = `✅ ${delivery.mealType} Has Arrived!`;
    notifMessage = `Food is now available at the common counter/mess hall. Present your QR pass to collect.`;
  } else if (newStatus === "DISPATCHED") {
    notifTitle = `📦 ${delivery.mealType} Dispatched`;
    notifMessage = `Meal containers have departed the kitchen and are in transit.`;
  } else if (newStatus === "ON_THE_WAY") {
    notifTitle = `🚚 ${delivery.mealType} On The Way`;
    notifMessage = `Vehicle is approaching the hostel premises.`;
  }

  await prisma.notification.create({
    data: {
      title: notifTitle,
      message: notifMessage,
      type: notifType,
      mealType: delivery.mealType,
    },
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/deliveries");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/history");

  return {
    success: true,
    delivery: { ...updatedDelivery, _id: updatedDelivery.id },
  };
}
