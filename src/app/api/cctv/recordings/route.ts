import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/permissions";
import { searchChannelRecordingsQuery } from "@/lib/cctv/queries";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const channelParam = searchParams.get("channel");
    const dateParam = searchParams.get("date"); // YYYY-MM-DD

    if (!channelParam || !dateParam) {
      return NextResponse.json(
        { error: "Channel and date query parameters are required" },
        { status: 400 }
      );
    }

    const channelNumber = parseInt(channelParam, 10);
    if (isNaN(channelNumber)) {
      return NextResponse.json({ error: "Invalid channel number" }, { status: 400 });
    }

    const recordings = await searchChannelRecordingsQuery(channelNumber, dateParam);
    return NextResponse.json({ recordings });
  } catch (error: any) {
    console.error("[CCTV Recordings Route] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search recordings" },
      { status: 500 }
    );
  }
}
