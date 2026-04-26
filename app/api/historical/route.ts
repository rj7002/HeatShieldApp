import { NextRequest, NextResponse } from "next/server";
import { ruralReferencePoints } from "@/lib/geocode";

export interface HistoricalYear {
  year: number;
  urban_avg_f: number;
  rural_avg_f: number;
  delta_f: number;
}

async function fetchSummerAvg(lat: number, lng: number): Promise<Record<number, number>> {
  const end = new Date().getFullYear() - 1;
  const start = end - 19;
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` +
    `&start_date=${start}-01-01&end_date=${end}-12-31` +
    `&daily=temperature_2m_max&timezone=auto`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("Archive API failed");
  const json = await res.json();

  const times: string[] = json.daily?.time ?? [];
  const temps: number[] = json.daily?.temperature_2m_max ?? [];

  // Average June–August per year
  const sumsByYear: Record<number, { sum: number; count: number }> = {};
  times.forEach((dateStr, i) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1; // 1-based
    const year = d.getFullYear();
    if (month >= 6 && month <= 8 && temps[i] != null) {
      if (!sumsByYear[year]) sumsByYear[year] = { sum: 0, count: 0 };
      sumsByYear[year].sum += temps[i];
      sumsByYear[year].count += 1;
    }
  });

  const avgByYear: Record<number, number> = {};
  for (const [y, { sum, count }] of Object.entries(sumsByYear)) {
    avgByYear[+y] = parseFloat(((sum / count) * 9 / 5 + 32).toFixed(1));
  }
  return avgByYear;
}

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "");
  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  // Use north + south reference points only — averaging two cuts directional bias
  // without 4× the archive fetch (each call is 20 years of daily data).
  const [north, , , south] = ruralReferencePoints(lat, lng); // north idx=0, south idx=1
  const [urbanAvgs, northAvgs, southAvgs] = await Promise.all([
    fetchSummerAvg(lat, lng),
    fetchSummerAvg(north.lat, north.lng),
    fetchSummerAvg(south.lat, south.lng),
  ]);

  const years = Object.keys(urbanAvgs)
    .map(Number)
    .sort()
    .map((year): HistoricalYear => {
      const ruralAvgF =
        northAvgs[year] != null && southAvgs[year] != null
          ? parseFloat(((northAvgs[year] + southAvgs[year]) / 2).toFixed(1))
          : (northAvgs[year] ?? southAvgs[year] ?? urbanAvgs[year] - 2);
      return {
        year,
        urban_avg_f: urbanAvgs[year],
        rural_avg_f: ruralAvgF,
        delta_f: parseFloat((urbanAvgs[year] - ruralAvgF).toFixed(1)),
      };
    });

  return NextResponse.json({ years });
}
