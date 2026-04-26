import { NextRequest, NextResponse } from "next/server";

export interface GreenHour {
  hour: number;
  label: string;
  solar_w: number;
  green_score: number; // 0–100
  tier: "best" | "good" | "avoid";
  temp_f: number;
}

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "");
  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&hourly=shortwave_radiation,temperature_2m&timezone=auto&forecast_days=2`;

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) return NextResponse.json({ error: "weather fetch failed" }, { status: 502 });
  const json = await res.json();

  const times: string[] = json.hourly?.time ?? [];
  const solar: number[] = json.hourly?.shortwave_radiation ?? [];
  const temps: number[] = json.hourly?.temperature_2m ?? [];

  // Take the next 24 hours from now
  const now = new Date();
  const nowStr = now.toISOString().slice(0, 13);
  const startIdx = times.findIndex((t) => t.slice(0, 13) >= nowStr);
  const slice = (arr: number[]) => arr.slice(startIdx, startIdx + 24);

  const solarSlice = slice(solar);
  const tempSlice = slice(temps);
  const timeSlice = times.slice(startIdx, startIdx + 24);

  const maxSolar = Math.max(...solarSlice, 1);

  const hours: GreenHour[] = timeSlice.map((t, i) => {
    const d = new Date(t);
    const hour = d.getHours();
    const sw = solarSlice[i] ?? 0;
    // Green score: solar radiation drives renewables. Night gets a small base score (nuclear).
    const green_score = sw > 10
      ? Math.round(20 + (sw / maxSolar) * 75)
      : 20; // ~20% base at night (nuclear + hydro floor)

    const tier: GreenHour["tier"] =
      green_score >= 70 ? "best" : green_score >= 40 ? "good" : "avoid";

    const ampm = hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`;

    return {
      hour,
      label: ampm,
      solar_w: Math.round(sw),
      green_score,
      tier,
      temp_f: parseFloat(((tempSlice[i] ?? 0) * 9 / 5 + 32).toFixed(1)),
    };
  });

  return NextResponse.json({ hours });
}
