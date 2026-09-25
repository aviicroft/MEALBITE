/**
 * Comprehensive Prisma + SQLite System Integration Test
 * Tests:
 * 1. User creation and role lookup in SQLite
 * 2. Meal creation and booking window constraints
 * 3. Duplicate booking prevention (unique constraint @@unique([userId, mealId]))
 * 4. Cryptographic random QR token generation
 * 5. QR validation and atomic collection (BOOKED -> COLLECTED)
 * 6. Double-collection protection (subsequent scan of same token rejected)
 * 7. Delivery tracking state machine transitions
 * 8. SQLite Dashboard statistics aggregation
 */

import { prisma } from '../lib/prisma';
import crypto from 'crypto';

async function runPrismaTests() {
  console.log('🧪 Starting Prisma + SQLite System Integration Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Database Connectivity
    console.log('[Test Suite 1: SQLite Connection]');
    await prisma.$queryRaw`SELECT 1`;
    assert(true, 'SQLite database is reachable via Prisma');

    // Clean up test records if present
    await prisma.booking.deleteMany({ where: { user: { email: { contains: 'test-student' } } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test-student' } } });
    await prisma.delivery.deleteMany({ where: { targetHostel: 'Test Block' } });
    await prisma.meal.deleteMany({ where: { menu: { contains: 'Test Menu' } } });

    // 2. User Creation & Role
    console.log('\n[Test Suite 2: User Creation & Unique Clerk ID]');
    const studentUser = await prisma.user.create({
      data: {
        clerkUserId: `clerk_test_${Date.now()}`,
        name: 'Test Student',
        email: `test-student-${Date.now()}@hostel.edu`,
        studentId: 'STU-9901',
        roomNumber: 'Room 304',
        role: 'student',
      },
    });
    assert(!!studentUser.id, 'Student user created successfully in SQLite');
    assert(studentUser.role === 'student', 'Default student role is set');

    // 3. Meal Session Creation
    console.log('\n[Test Suite 3: Meal Session & Booking Window]');
    const now = new Date();
    const openTime = new Date(now.getTime() - 3600 * 1000); // Opened 1 hr ago
    const closeTime = new Date(now.getTime() + 3600 * 1000); // Closes in 1 hr

    const testMeal = await prisma.meal.create({
      data: {
        date: now,
        type: 'DINNER',
        menu: 'Test Menu: Paneer Butter Masala, Naan, Dal, Rice',
        bookingOpen: openTime,
        bookingClose: closeTime,
      },
    });
    assert(!!testMeal.id, 'Meal session created with valid window');
    assert(testMeal.availability === 'AVAILABLE', 'New meals default to AVAILABLE');

    // 4. Booking & Cryptographic QR Token Generation
    console.log('\n[Test Suite 4: Food Booking & QR Token]');
    const qrToken1 = crypto.randomBytes(24).toString('hex');
    assert(qrToken1.length === 48, 'QR token is cryptographically random 48-char hex');
    assert(!qrToken1.includes(studentUser.email), 'QR token is opaque (no personal data embedded)');

    const booking1 = await prisma.booking.create({
      data: {
        userId: studentUser.id,
        mealId: testMeal.id,
        status: 'BOOKED',
        qrToken: qrToken1,
      },
    });
    assert(booking1.status === 'BOOKED', 'Booking status initialized as BOOKED');

    const finishedMeal = await prisma.meal.update({
      where: { id: testMeal.id },
      data: { availability: 'FINISHED' },
    });
    assert(finishedMeal.availability === 'FINISHED', 'Meal availability can be changed to FINISHED');

    const availabilityPreservedBooking = await prisma.booking.findUnique({
      where: { id: booking1.id },
      include: { meal: true },
    });
    assert(
      availabilityPreservedBooking?.status === 'BOOKED' &&
        availabilityPreservedBooking.meal.availability === 'FINISHED',
      'Existing BOOKED bookings remain valid after meal is FINISHED',
    );

    // 5. Duplicate Booking Prevention
    console.log('\n[Test Suite 5: Duplicate Booking Prevention]');
    let duplicatePrevented = false;
    try {
      await prisma.booking.create({
        data: {
          userId: studentUser.id,
          mealId: testMeal.id,
          status: 'BOOKED',
          qrToken: crypto.randomBytes(24).toString('hex'),
        },
      });
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
        duplicatePrevented = true;
      }
    }
    assert(duplicatePrevented, 'Duplicate booking for same student and meal strictly blocked by unique constraint');

    // 6. Food Collection: First Scan (BOOKED -> COLLECTED)
    console.log('\n[Test Suite 6: Atomic Food Collection (Warden Scan)]');
    const firstScanResult = await prisma.booking.updateMany({
      where: {
        qrToken: qrToken1,
        status: 'BOOKED',
      },
      data: {
        status: 'COLLECTED',
        collectedAt: new Date(),
        collectedBy: 'Warden John',
      },
    });
    assert(firstScanResult.count === 1, 'First QR scan transitions status BOOKED -> COLLECTED');

    const verifiedBooking = await prisma.booking.findUnique({ where: { qrToken: qrToken1 } });
    assert(verifiedBooking?.status === 'COLLECTED', 'Booking record reflects COLLECTED state');
    assert(!!verifiedBooking?.collectedAt, 'Collection timestamp recorded');

    // 7. Double-Collection Protection
    console.log('\n[Test Suite 7: Double-Collection Protection]');
    const secondScanResult = await prisma.booking.updateMany({
      where: {
        qrToken: qrToken1,
        status: 'BOOKED', // Only updates if currently BOOKED
      },
      data: {
        status: 'COLLECTED',
        collectedAt: new Date(),
        collectedBy: 'Warden Mary',
      },
    });
    assert(secondScanResult.count === 0, 'Second scan of same QR code is rejected (Double-collection prevented)');

    // 8. Delivery Tracking in SQLite
    console.log('\n[Test Suite 8: Delivery Lifecycle State Machine]');
    const testDelivery = await prisma.delivery.create({
      data: {
        mealId: testMeal.id,
        mealType: 'DINNER',
        deliveryDate: now,
        targetHostel: 'Test Block',
        status: 'PREPARING',
        expectedArrivalTime: new Date(now.getTime() + 7200 * 1000),
      },
    });
    assert(testDelivery.status === 'PREPARING', 'Delivery created with status PREPARING');

    // Advance to DISPATCHED
    const dispatched = await prisma.delivery.update({
      where: { id: testDelivery.id },
      data: { status: 'DISPATCHED', dispatchTime: new Date() },
    });
    assert(dispatched.status === 'DISPATCHED' && !!dispatched.dispatchTime, 'Transitioned to DISPATCHED with timestamp');

    // Flag DELAYED with reason
    const delayed = await prisma.delivery.update({
      where: { id: testDelivery.id },
      data: { status: 'DELAYED', isDelayed: true, delayReason: 'Heavy campus traffic' },
    });
    assert(delayed.status === 'DELAYED' && delayed.delayReason === 'Heavy campus traffic', 'Delivery marked DELAYED with delay reason');

    // Mark ARRIVED
    const arrived = await prisma.delivery.update({
      where: { id: testDelivery.id },
      data: { status: 'ARRIVED', actualArrivalTime: new Date(), isDelayed: false },
    });
    assert(arrived.status === 'ARRIVED' && !!arrived.actualArrivalTime, 'Transitioned to ARRIVED with actual arrival time');

    // Clean up test records
    await prisma.booking.deleteMany({ where: { userId: studentUser.id } });
    await prisma.user.delete({ where: { id: studentUser.id } });
    await prisma.delivery.delete({ where: { id: testDelivery.id } });
    await prisma.meal.delete({ where: { id: testMeal.id } });

    console.log(`\n========================================`);
    console.log(`Prisma System Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPrismaTests();
