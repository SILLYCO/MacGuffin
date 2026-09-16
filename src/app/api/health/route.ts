import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const startTime = Date.now();
    // Execute a lightweight query to generate active traffic and prevent Supabase pausing
    await db.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      latencyMs: `${latency}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
