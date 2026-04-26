import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");
  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "HeatShield/1.0 (hackathon project)" },
  });
  if (!res.ok) return NextResponse.json({ error: "reverse geocode failed" }, { status: 502 });

  const data = await res.json();
  const addr = data.address ?? {};
  const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? "";
  const state = addr.state ?? "";
  const label = [city, state].filter(Boolean).join(", ");

  return NextResponse.json({ label, displayName: data.display_name ?? label });
}
