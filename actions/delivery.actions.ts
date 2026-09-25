"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
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
    let active = await sql`
      SELECT * FROM "Delivery"
      WHERE status IN ('PREPARING', 'DISPATCHED', 'ON_THE_WAY', 'DELAYED')
      ORDER BY "deliveryDate" DESC, "createdAt" DESC
      LIMIT 1
    `;

    // If none active, return the most recent arrived delivery
    if (!active || active.length === 0) {
      active = await sql`
        SELECT * FROM "Delivery"
        ORDER BY "deliveryDate" DESC, "createdAt" DESC
        LIMIT 1
      `;
    }

    if (!active || active.length === 0) return null;

    const d = active[0];
    return {
      id: d.id,
      _id: d.id,
      mealId: d.mealId,
      mealType: d.mealType as MealType,
      deliveryDate: new Date(d.deliveryDate),
      targetHostel: d.targetHostel,
      status: d.status as DeliveryStatus,
      dispatchTime: d.dispatchTime ? new Date(d.dispatchTime) : undefined,
      expectedArrivalTime: new Date(d.expectedArrivalTime),
      actualArrivalTime: d.actualArrivalTime ? new Date(d.actualArrivalTime) : undefined,
      isDelayed: Boolean(d.isDelayed),
      delayReason: d.delayReason || "",
      notes: d.notes || "",
      updatedBy: d.updatedBy,
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(d.updatedAt),
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

    const mealType = filters?.mealType && filters.mealType !== "ALL" ? filters.mealType : null;
    const status = filters?.status && filters.status !== "ALL" ? filters.status : null;

    let startDate: string | null = null;
    let endDate: string | null = null;
    if (filters?.date) {
      const selected = new Date(filters.date);
      if (!isNaN(selected.getTime())) {
        startDate = new Date(selected.setHours(0, 0, 0, 0)).toISOString();
        endDate = new Date(selected.setHours(23, 59, 59, 999)).toISOString();
      }
    }

    const deliveries = await sql`
      SELECT * FROM "Delivery"
      WHERE (${mealType}::text IS NULL OR "mealType" = ${mealType})
        AND (${status}::text IS NULL OR status = ${status})
        AND (${startDate}::text IS NULL OR "deliveryDate" >= ${startDate}::timestamp)
        AND (${endDate}::text IS NULL OR "deliveryDate" <= ${endDate}::timestamp)
      ORDER BY "deliveryDate" DESC, "createdAt" DESC
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return deliveries.map((d: any) => ({
      id: d.id,
      _id: d.id,
      mealId: d.mealId,
      mealType: d.mealType as MealType,
      deliveryDate: new Date(d.deliveryDate),
      targetHostel: d.targetHostel,
      status: d.status as DeliveryStatus,
      dispatchTime: d.dispatchTime ? new Date(d.dispatchTime) : undefined,
      expectedArrivalTime: new Date(d.expectedArrivalTime),
      actualArrivalTime: d.actualArrivalTime ? new Date(d.actualArrivalTime) : undefined,
      isDelayed: Boolean(d.isDelayed),
      delayReason: d.delayReason || "",
      notes: d.notes || "",
      updatedBy: d.updatedBy,
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(d.updatedAt),
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
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    const [todayDeliveries, todayMeals, todayBookings] = await Promise.all([
      sql`SELECT status, "isDelayed" FROM "Delivery" WHERE "deliveryDate" >= ${startOfToday}::timestamp AND "deliveryDate" <= ${endOfToday}::timestamp`,
      sql`SELECT id FROM "Meal" WHERE date >= ${startOfToday}::timestamp AND date <= ${endOfToday}::timestamp`,
      sql`SELECT status FROM "Booking" WHERE "bookedAt" >= ${startOfToday}::timestamp AND "bookedAt" <= ${endOfToday}::timestamp`,
    ]);

    const todayTotal = todayDeliveries.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completed = todayDeliveries.filter((d: any) => d.status === "ARRIVED").length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delayed = todayDeliveries.filter((d: any) => d.isDelayed || d.status === "DELAYED").length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pending = todayDeliveries.filter((d: any) =>
      ["PREPARING", "DISPATCHED", "ON_THE_WAY", "DELAYED"].includes(d.status)
    ).length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collectedCount = todayBookings.filter((b: any) => b.status === "COLLECTED").length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pendingCollectionCount = todayBookings.filter((b: any) => b.status === "BOOKED").length;

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
    const notifications = await sql`
      SELECT id, title, message, type, "mealType", "createdAt"
      FROM "Notification"
      ORDER BY "createdAt" DESC
      LIMIT 5
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return notifications.map((n: any) => ({
      id: n.id,
      _id: n.id,
      title: n.title,
      message: n.message,
      type: n.type as INotification["type"],
      mealType: n.mealType,
      createdAt: new Date(n.createdAt),
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
  const user = await requireRole(["admin"]);

  const deliveryDate = new Date(formData.deliveryDate || new Date());
  
  // Parse expected arrival time
  const [hours, minutes] = formData.expectedArrivalTime.split(":").map(Number);
  const expectedDate = new Date(deliveryDate);
  if (!isNaN(hours) && !isNaN(minutes)) {
    expectedDate.setHours(hours, minutes, 0, 0);
  } else {
    expectedDate.setHours(expectedDate.getHours() + 1);
  }

  const deliveryId = crypto.randomUUID();
  const targetHostel = formData.targetHostel || "All Hostels (Block A, B, C)";
  const notes = formData.notes || "";
  const updatedBy = user.name || user.email;

  const newDeliveries = await sql`
    INSERT INTO "Delivery" (
      id, "mealType", "deliveryDate", "expectedArrivalTime", "targetHostel",
      notes, status, "isDelayed", "delayReason", "updatedBy", "createdAt", "updatedAt"
    )
    VALUES (
      ${deliveryId}, ${formData.mealType}, ${deliveryDate.toISOString()}, ${expectedDate.toISOString()}, ${targetHostel},
      ${notes}, 'PREPARING', false, '', ${updatedBy}, NOW(), NOW()
    )
    RETURNING *
  `;

  const newDelivery = newDeliveries[0];

  // Post in-app announcement
  const notifId = crypto.randomUUID();
  await sql`
    INSERT INTO "Notification" (id, title, message, type, "mealType", "createdAt")
    VALUES (
      ${notifId},
      ${formData.mealType + ' Delivery Scheduled'},
      ${formData.mealType + ' session initialized. Expected arrival ~ ' + expectedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + '.'},
      'STATUS_UPDATE',
      ${formData.mealType},
      NOW()
    )
  `;

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
  const user = await requireRole(["admin"]);

  const deliveries = await sql`
    SELECT * FROM "Delivery" WHERE id = ${deliveryId} LIMIT 1
  `;

  if (!deliveries || deliveries.length === 0) throw new Error("Delivery record not found");
  const delivery = deliveries[0];

  const oldStatus = delivery.status as DeliveryStatus;

  // Validate state machine progression
  const allowedNext = VALID_TRANSITIONS[oldStatus] || [];
  if (oldStatus !== newStatus && !allowedNext.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${oldStatus} to ${newStatus}. Allowed: ${allowedNext.join(", ")}`
    );
  }

  let dispatchTime = delivery.dispatchTime;
  let actualArrivalTime = delivery.actualArrivalTime;
  let isDelayed = delivery.isDelayed;
  let delayReasonText = delivery.delayReason || "";
  const notesText = note ? note.trim() : delivery.notes || "";

  if (newStatus === "DISPATCHED" && !dispatchTime) {
    dispatchTime = new Date().toISOString();
  } else if (newStatus === "ARRIVED") {
    actualArrivalTime = new Date().toISOString();
    isDelayed = false;
  } else if (newStatus === "DELAYED") {
    isDelayed = true;
    if (delayReason) {
      delayReasonText = delayReason.trim();
    }
  }

  const updatedDeliveries = await sql`
    UPDATE "Delivery"
    SET status = ${newStatus},
        "dispatchTime" = ${dispatchTime ? new Date(dispatchTime).toISOString() : null},
        "actualArrivalTime" = ${actualArrivalTime ? new Date(actualArrivalTime).toISOString() : null},
        "isDelayed" = ${Boolean(isDelayed)},
        "delayReason" = ${delayReasonText},
        notes = ${notesText},
        "updatedBy" = ${user.name || user.email},
        "updatedAt" = NOW()
    WHERE id = ${deliveryId}
    RETURNING *
  `;

  const updatedDelivery = updatedDeliveries[0];

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

  const notifId = crypto.randomUUID();
  await sql`
    INSERT INTO "Notification" (id, title, message, type, "mealType", "createdAt")
    VALUES (${notifId}, ${notifTitle}, ${notifMessage}, ${notifType}, ${delivery.mealType}, NOW())
  `;

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/deliveries");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/history");

  return {
    success: true,
    delivery: { ...updatedDelivery, _id: updatedDelivery.id },
  };
}
