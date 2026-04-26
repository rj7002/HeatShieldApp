import { NextRequest, NextResponse } from "next/server";
import { getWeeklyForecast } from "@/lib/weather";
import { ruralReferencePoints } from "@/lib/geocode";

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "");
  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }
  const rural = ruralReferencePoints(lat, lng);
  const days = await getWeeklyForecast(lat, lng, rural);
  return NextResponse.json({ days });
}
