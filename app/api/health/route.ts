import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  let dbStatus = "not_checked";
  let dbError = null;

  try {
    await sql`SELECT 1 as ping`;
    dbStatus = "connected (Neon PostgreSQL Serverless)";
  } catch (error) {
    dbStatus = "connection_failed";
    dbError = error instanceof Error ? error.message : "Unknown error";
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Hostel Food Delivery Tracking System",
    database: {
      engine: "Neon PostgreSQL",
      status: dbStatus,
      error: dbError,
    },
    environment: process.env.NODE_ENV,
  });
}
