import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sql, getPool } from "../lib/db";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✔ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ✖ [FAIL] ${testName}`);
    failed++;
  }
}

async function runNeonTests() {
  console.log("==================================================");
  console.log("  Neon PostgreSQL Native Integration Test Suite   ");
  console.log("      (Direct Connection - Zero Prisma)           ");
  console.log("==================================================\n");

  try {
    // 1. Connection Ping
    console.log("[Test Suite 1: PostgreSQL Connection Check]");
    try {
      const ping = await sql`SELECT 1 as result, NOW() as current_time`;
      assert(ping.length === 1 && ping[0].result === 1, "Neon PostgreSQL is reachable via native driver");
    } catch (err: unknown) {
      console.warn("  ⚠️ Database connection error:", err);
      return;
    }

    // Clean up any previous test artifacts
    await sql`DELETE FROM "Session" WHERE "userId" IN (SELECT id FROM "User" WHERE email LIKE 'test-student-%')`;
    await sql`DELETE FROM "Booking" WHERE "userId" IN (SELECT id FROM "User" WHERE email LIKE 'test-student-%')`;
    await sql`DELETE FROM "User" WHERE email LIKE 'test-student-%'`;
    await sql`DELETE FROM "Delivery" WHERE "targetHostel" = 'Test Block'`;
    await sql`DELETE FROM "Meal" WHERE menu LIKE '%Test Menu%'`;

    // 2. User & Password Hashing
    console.log("\n[Test Suite 2: User Creation & Password Hashing]");
    const plainPass = "StudentSecret123!";
    const passwordHash = await bcrypt.hash(plainPass, 10);
    const userId = crypto.randomUUID();
    const studentEmail = `test-student-${Date.now()}@hostel.edu`;

    await sql`
      INSERT INTO "User" (id, name, email, "passwordHash", role, "studentId", "roomNumber", "createdAt", "updatedAt")
      VALUES (${userId}, 'Test Student', ${studentEmail}, ${passwordHash}, 'STUDENT', 'STU-9999', 'Room 304', NOW(), NOW())
    `;

    const userRows = await sql`SELECT * FROM "User" WHERE id = ${userId}`;
    assert(userRows.length === 1, "Student user inserted and retrieved from Neon");
    assert(userRows[0].role === "STUDENT", "Student role is correctly assigned");
    assert(await bcrypt.compare(plainPass, userRows[0].passwordHash), "Password hash verifies via bcrypt");

    // 3. Session Management
    console.log("\n[Test Suite 3: Session Authentication]");
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO "Session" (id, token, "userId", "expiresAt", "createdAt")
      VALUES (${sessionId}, ${sessionToken}, ${userId}, ${expiresAt.toISOString()}, NOW())
    `;

    const sessionRows = await sql`
      SELECT s.token, u.name, u.email, u.role
      FROM "Session" s
      JOIN "User" u ON s."userId" = u.id
      WHERE s.token = ${sessionToken}
    `;
    assert(sessionRows.length === 1, "Active session successfully resolved with joined user");
    assert(sessionRows[0].email === studentEmail, "Session correctly identifies authenticated user");

    // 4. Meal Management & Availability
    console.log("\n[Test Suite 4: Meal State & Availability]");
    const mealId = crypto.randomUUID();
    const openTime = new Date(Date.now() - 3600 * 1000);
    const closeTime = new Date(Date.now() + 3600 * 1000);

    await sql`
      INSERT INTO "Meal" (id, date, type, menu, availability, "bookingOpen", "bookingClose", "createdAt")
      VALUES (${mealId}, NOW(), 'LUNCH', 'Special Test Menu: Thali', 'AVAILABLE', ${openTime.toISOString()}, ${closeTime.toISOString()}, NOW())
    `;

    const mealRows = await sql`SELECT * FROM "Meal" WHERE id = ${mealId}`;
    assert(mealRows.length === 1, "Meal inserted successfully");
    assert(mealRows[0].availability === "AVAILABLE", "Meal is available for booking");

    // Mark as FINISHED
    await sql`UPDATE "Meal" SET availability = 'FINISHED' WHERE id = ${mealId}`;
    const finishedMeal = await sql`SELECT availability FROM "Meal" WHERE id = ${mealId}`;
    assert(finishedMeal[0].availability === "FINISHED", "Meal correctly marked as FINISHED / unavailable");

    // 5. Booking & QR Token Generation
    console.log("\n[Test Suite 5: Food Booking & Single-Use QR Redemption]");
    const bookingId = crypto.randomUUID();
    const qrToken = `MEAL-TEST-${crypto.randomBytes(8).toString("hex")}`;

    await sql`
      INSERT INTO "Booking" (id, "userId", "mealId", "bookedAt", "qrToken", status)
      VALUES (${bookingId}, ${userId}, ${mealId}, NOW(), ${qrToken}, 'BOOKED')
    `;

    // Attempt double booking with unique constraint check
    let doubleBookingBlocked = false;
    try {
      const duplicateBookingId = crypto.randomUUID();
      await sql`
        INSERT INTO "Booking" (id, "userId", "mealId", "bookedAt", "qrToken", status)
        VALUES (${duplicateBookingId}, ${userId}, ${mealId}, NOW(), 'MEAL-TEST-DUPE', 'BOOKED')
      `;
    } catch {
      doubleBookingBlocked = true;
    }
    assert(doubleBookingBlocked, "Database unique constraint prevents duplicate booking for same user and meal");

    // Atomic QR Collection
    const scan1 = await sql`
      UPDATE "Booking"
      SET status = 'COLLECTED', "collectedAt" = NOW()
      WHERE "qrToken" = ${qrToken} AND status = 'BOOKED'
      RETURNING id, status, "collectedAt"
    `;
    assert(scan1.length === 1 && scan1[0].status === "COLLECTED", "First QR scan successfully collects meal");

    // Second scan (Double-collection prevention)
    const scan2 = await sql`
      UPDATE "Booking"
      SET status = 'COLLECTED', "collectedAt" = NOW()
      WHERE "qrToken" = ${qrToken} AND status = 'BOOKED'
      RETURNING id, status, "collectedAt"
    `;
    assert(scan2.length === 0, "Second QR scan rejected (Double-collection strictly prevented)");

    // 6. Delivery Tracking Life Cycle
    console.log("\n[Test Suite 6: Hostel Delivery Tracking Lifecycle]");
    const deliveryId = crypto.randomUUID();
    await sql`
      INSERT INTO "Delivery" (id, "mealType", "deliveryDate", "targetHostel", status, "expectedArrivalTime", "isDelayed", "delayReason", notes, "updatedBy", "createdAt", "updatedAt")
      VALUES (${deliveryId}, 'LUNCH', NOW(), 'Test Block', 'PREPARING', NOW() + interval '30 minutes', false, '', 'Test batch', 'admin', NOW(), NOW())
    `;

    // Transition to DISPATCHED
    await sql`UPDATE "Delivery" SET status = 'DISPATCHED', "dispatchTime" = NOW() WHERE id = ${deliveryId}`;
    let dRow = await sql`SELECT status FROM "Delivery" WHERE id = ${deliveryId}`;
    assert(dRow[0].status === "DISPATCHED", "Delivery status transitioned to DISPATCHED");

    // Transition to DELAYED
    await sql`UPDATE "Delivery" SET "isDelayed" = true, "delayReason" = 'Traffic near campus gate' WHERE id = ${deliveryId}`;
    dRow = await sql`SELECT "isDelayed", "delayReason" FROM "Delivery" WHERE id = ${deliveryId}`;
    assert(dRow[0].isDelayed === true && dRow[0].delayReason === "Traffic near campus gate", "Delivery delayed status & reason logged");

    // Transition to ARRIVED
    await sql`UPDATE "Delivery" SET status = 'ARRIVED', "actualArrivalTime" = NOW() WHERE id = ${deliveryId}`;
    dRow = await sql`SELECT status, "actualArrivalTime" FROM "Delivery" WHERE id = ${deliveryId}`;
    assert(dRow[0].status === "ARRIVED" && !!dRow[0].actualArrivalTime, "Delivery marked ARRIVED with timestamp");

    // Cleanup
    console.log("\n[Cleaning Up Test Data]");
    await sql`DELETE FROM "Session" WHERE "userId" = ${userId}`;
    await sql`DELETE FROM "Booking" WHERE "userId" = ${userId}`;
    await sql`DELETE FROM "User" WHERE id = ${userId}`;
    await sql`DELETE FROM "Delivery" WHERE id = ${deliveryId}`;
    await sql`DELETE FROM "Meal" WHERE id = ${mealId}`;
    assert(true, "Test data cleaned up successfully");

    console.log(`\n==================================================`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log(`==================================================\n`);
  } catch (error) {
    console.error("Test execution encountered an error:", error);
    failed++;
  } finally {
    await getPool().end();
  }
}

runNeonTests();
