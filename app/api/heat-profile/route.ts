import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress, ruralReferencePoints } from "@/lib/geocode";
import { getUrbanAndRuralTemps } from "@/lib/weather";
import type { BBox } from "@/lib/geocode";

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";
const MODEL = "gemini-2.5-flash";

export interface HeatProfileResponse {
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  bbox: BBox;
  urban_temp_f: number;
  rural_temp_f: number;
  uhi_delta_f: number;
  humidity: number;
  feels_like_f: number;
  risk_score: number;
  risk_level: "Low" | "Moderate" | "High" | "Extreme";
  risk_factors: string[];
  vulnerable_groups: string[];
  health_risks: string[];
  ai_summary: string;
}

// Deterministic score based on NOAA/NWS Heat Index danger thresholds.
// Source: https://www.weather.gov/ama/heatindex
function computeRisk(feelsLikeF: number, uhiDeltaF: number): {
  score: number;
  level: HeatProfileResponse["risk_level"];
} {
  let score: number;
  if      (feelsLikeF < 75)  score = 1;
  else if (feelsLikeF < 80)  score = 2; // below NWS Caution
  else if (feelsLikeF < 85)  score = 3;
  else if (feelsLikeF < 90)  score = 4; // NWS Caution: 80–90 °F
  else if (feelsLikeF < 95)  score = 5;
  else if (feelsLikeF < 100) score = 6; // NWS Extreme Caution: 90–103 °F
  else if (feelsLikeF < 103) score = 7;
  else if (feelsLikeF < 115) score = 8; // NWS Danger: 103–124 °F
  else if (feelsLikeF < 125) score = 9;
  else                        score = 10; // NWS Extreme Danger: 125 °F+

  // City is 7 °F+ hotter than its own rural fringe → bump one tier
  if (uhiDeltaF >= 7) score = Math.min(10, score + 1);

  const level: HeatProfileResponse["risk_level"] =
    score <= 2 ? "Low"      :
    score <= 4 ? "Moderate" :
    score <= 7 ? "High"     : "Extreme";

  return { score, level };
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address param required" }, { status: 400 });
  }

  const geo = await geocodeAddress(address);
  if (!geo) {
    return NextResponse.json({ error: "Could not geocode address" }, { status: 404 });
  }

  const rural = ruralReferencePoints(geo.lat, geo.lng);
  const { urban, uhiDelta } = await getUrbanAndRuralTemps(geo.lat, geo.lng, rural);

  const uhi_delta_f  = parseFloat(((uhiDelta * 9) / 5).toFixed(1));
  const urban_temp_f = parseFloat(urban.temp_f.toFixed(1));
  const rural_temp_f = parseFloat((urban.temp_f - uhi_delta_f).toFixed(1));
  const feels_like_f = parseFloat(((urban.feels_like_c * 9) / 5 + 32).toFixed(1));

  const { score, level } = computeRisk(feels_like_f, uhi_delta_f);

  // Gemini generates only the narrative — score and level are already fixed above.
  const prompt = `You are an urban heat island expert. Analyze these conditions for ${geo.displayName}:

- Urban temperature: ${urban_temp_f}°F
- Feels like: ${feels_like_f}°F (humidity ${urban.humidity}%)
- UHI effect: +${uhi_delta_f}°F above the 4-point rural average
- Heat risk: ${level} (${score}/10, NOAA Heat Index scale)
- Weather: ${urban.description}

Return ONLY a valid JSON object:
{
  "risk_factors":      [<3-4 specific UHI risk factors visible in this type of city>],
  "vulnerable_groups": [<3-4 groups most at risk today>],
  "health_risks":      [<3-4 specific health risks at ${feels_like_f}°F feels-like>],
  "ai_summary":        "<2-3 sentence plain-English brief for a resident>"
}`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 400, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(20_000),
    }
  );

  let narrative: Pick<HeatProfileResponse, "risk_factors" | "vulnerable_groups" | "health_risks" | "ai_summary"> = {
    risk_factors:      ["Dense impervious surfaces", "Limited tree canopy", "Heat-absorbing building materials"],
    vulnerable_groups: ["Elderly residents", "Outdoor workers", "Children", "People without AC"],
    health_risks:      ["Heat exhaustion", "Dehydration", "Cardiovascular stress"],
    ai_summary:        `${geo.city} is experiencing ${level.toLowerCase()} heat conditions with a feels-like temperature of ${feels_like_f}°F and an urban heat island effect of +${uhi_delta_f}°F.`,
  };

  try {
    const geminiJson = await geminiRes.json();
    const raw = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    if (parsed.ai_summary) narrative = parsed;
  } catch { /* use fallback narrative */ }

  return NextResponse.json({
    address:         geo.displayName,
    city:            geo.city,
    state:           geo.state,
    lat:             geo.lat,
    lng:             geo.lng,
    bbox:            geo.bbox,
    urban_temp_f,
    rural_temp_f,
    uhi_delta_f,
    humidity:        urban.humidity,
    feels_like_f,
    risk_score:      score,
    risk_level:      level,
    risk_factors:    narrative.risk_factors,
    vulnerable_groups: narrative.vulnerable_groups,
    health_risks:    narrative.health_risks,
    ai_summary:      narrative.ai_summary,
  } satisfies HeatProfileResponse);
}
