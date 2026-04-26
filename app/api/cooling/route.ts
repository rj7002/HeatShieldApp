import { NextRequest, NextResponse } from "next/server";
import { findCoolingCenters } from "@/lib/overpass";
import type { BBox } from "@/lib/geocode";

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "");
  const south = parseFloat(req.nextUrl.searchParams.get("south") ?? "");
  const north = parseFloat(req.nextUrl.searchParams.get("north") ?? "");
  const west  = parseFloat(req.nextUrl.searchParams.get("west")  ?? "");
  const east  = parseFloat(req.nextUrl.searchParams.get("east")  ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  // Fall back to a default ~5km bbox if callers don't send one
  const bbox: BBox = isNaN(south)
    ? { south: lat - 0.045, north: lat + 0.045, west: lng - 0.045, east: lng + 0.045 }
    : { south, north, west, east };

  const centers = await findCoolingCenters(lat, lng, bbox);
  return NextResponse.json({ centers });
}
