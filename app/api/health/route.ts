import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let dbStatus = "not_checked";
  let dbError = null;

  try {
    // Perform a lightweight SQLite query
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected (SQLite + Prisma)";
  } catch (error) {
    dbStatus = "connection_failed";
    dbError = error instanceof Error ? error.message : "Unknown error";
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Hostel Food Delivery Tracking System",
    database: {
      engine: "SQLite",
      status: dbStatus,
      error: dbError,
    },
    environment: process.env.NODE_ENV,
  });
}
