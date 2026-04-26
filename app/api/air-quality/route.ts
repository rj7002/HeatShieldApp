import { NextRequest, NextResponse } from "next/server";

export interface HourlyAQ {
  hour: number;
  label: string;
  aqi: number;
  pm25: number;
  uv: number;
}

export interface NWSAlert {
  event: string;
  headline: string;
  severity: string;
  expires: string;
}

export interface AirQualityData {
  aqi: number;
  aqi_category: string;
  pm25: number;
  ozone_ug: number;
  uv_index: number;
  uv_category: string;
  uv_burn_min: number | null;
  peak_uv: number;
  peak_uv_hour: number;
  safe_outdoor_hours: number[]; // hours of day where uv < 3
  hourly: HourlyAQ[];
  nws_alerts: NWSAlert[];
}

function aqiCategory(aqi: number): string {
  if (aqi <= 50)  return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

function uvCategory(uv: number): string {
  if (uv < 3)  return "Low";
  if (uv < 6)  return "Moderate";
  if (uv < 8)  return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}

// Minutes until sunburn for average (type II) skin with no sunscreen
function burnTime(uv: number): number | null {
  if (uv < 1) return null;
  return Math.round(133 / uv);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "0");
  const lng = parseFloat(searchParams.get("lng") ?? "0");
  if (!lat || !lng) return NextResponse.json({ error: "lat/lng required" }, { status: 400 });

  // Fetch air quality and UV from Open-Meteo (free, no key)
  const aqRes = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}` +
    `&hourly=pm2_5,ozone,us_aqi,uv_index&timezone=auto&forecast_days=1`,
    { next: { revalidate: 1800 }, signal: AbortSignal.timeout(10_000) }
  );
  if (!aqRes.ok) return NextResponse.json({ error: "air quality fetch failed" }, { status: 502 });
  const aqJson = await aqRes.json();

  const times: string[] = aqJson.hourly?.time ?? [];
  const pm25Arr: number[] = aqJson.hourly?.pm2_5 ?? [];
  const ozoneArr: number[] = aqJson.hourly?.ozone ?? [];
  const aqiArr: number[] = aqJson.hourly?.us_aqi ?? [];
  const uvArr: number[] = aqJson.hourly?.uv_index ?? [];

  // Find current hour index
  const nowStr = new Date().toISOString().slice(0, 13);
  const nowIdx = Math.max(0, times.findIndex((t) => t.slice(0, 13) >= nowStr));

  const currentAqi  = aqiArr[nowIdx]   ?? 0;
  const currentPm25 = pm25Arr[nowIdx]  ?? 0;
  const currentOzone = ozoneArr[nowIdx] ?? 0;
  const currentUv   = uvArr[nowIdx]    ?? 0;

  // Peak UV today
  const peakUv = Math.max(...uvArr.slice(0, 24), 0);
  const peakUvHour = uvArr.indexOf(peakUv);

  // Hours where UV < 3 (safe for unprotected exposure)
  const safeHours = uvArr
    .slice(0, 24)
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v < 3)
    .map(({ i }) => new Date(times[i] ?? "").getHours());

  // Build hourly array for chart (next 24h)
  const hourly: HourlyAQ[] = times.slice(0, 24).map((t, i) => {
    const d = new Date(t);
    const h = d.getHours();
    const ampm = h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
    return {
      hour: h,
      label: ampm,
      aqi: aqiArr[i]   ?? 0,
      pm25: pm25Arr[i]  ?? 0,
      uv: uvArr[i]     ?? 0,
    };
  });

  // NWS heat alerts (US only — gracefully fails for other countries)
  const nwsAlerts: NWSAlert[] = [];
  try {
    const nwsRes = await fetch(
      `https://api.weather.gov/alerts/active?point=${lat},${lng}`,
      { signal: AbortSignal.timeout(5_000), headers: { "User-Agent": "heatshield-app" } }
    );
    if (nwsRes.ok) {
      const nwsJson = await nwsRes.json();
      const features = (nwsJson.features ?? []) as {
        properties: { event: string; headline: string; severity: string; expires: string };
      }[];
      const HEAT_EVENTS = ["Heat", "Excessive Heat", "Hot", "High Temperature"];
      for (const f of features) {
        const ev = f.properties.event ?? "";
        if (HEAT_EVENTS.some((k) => ev.includes(k))) {
          nwsAlerts.push({
            event:    f.properties.event,
            headline: f.properties.headline ?? ev,
            severity: f.properties.severity ?? "Unknown",
            expires:  f.properties.expires ?? "",
          });
        }
      }
    }
  } catch { /* not US or network error — ignore */ }

  const result: AirQualityData = {
    aqi: currentAqi,
    aqi_category: aqiCategory(currentAqi),
    pm25: parseFloat(currentPm25.toFixed(1)),
    ozone_ug: parseFloat(currentOzone.toFixed(0)),
    uv_index: parseFloat(currentUv.toFixed(1)),
    uv_category: uvCategory(currentUv),
    uv_burn_min: burnTime(currentUv),
    peak_uv: parseFloat(peakUv.toFixed(1)),
    peak_uv_hour: peakUvHour,
    safe_outdoor_hours: safeHours,
    hourly,
    nws_alerts: nwsAlerts,
  };

  return NextResponse.json(result);
}
