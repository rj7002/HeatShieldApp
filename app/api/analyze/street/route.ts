import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";
const MODEL = "gemini-2.5-flash-lite"; // confirmed working for vision; 2.5-flash = 20 vision req/day free

export interface StreetData {
  heat_score: number;
  impervious_pct: number;
  tree_canopy_pct: number;
  dark_roof_pct: number;
  light_roof_pct: number;
  green_space_pct: number;
  water_pct: number;
  estimated_uhi_delta_f: number;
  key_heat_sources: string[];
  cooling_assets: string[];
  recommendations: {
    action: string;
    temp_reduction_f: number;
    cost_estimate: string;
    feasibility: "High" | "Medium" | "Low";
    trees?: number;
    cool_roof_pct?: number;
    green_acres?: number;
  }[];
  confidence: "high" | "medium" | "low";
  unreadable: boolean;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No image" }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp";

  const prompt = `You are an urban heat island expert analyzing an aerial, satellite, or street-level photo of a neighborhood.

Carefully examine the image and estimate the following. Return ONLY a valid JSON object with this exact schema:

{
  "heat_score": <integer 1-10, urban heat island severity>,
  "impervious_pct": <integer 0-100, % of visible area that is roads, parking lots, concrete, hard surfaces>,
  "tree_canopy_pct": <integer 0-100, % of visible area covered by tree canopy>,
  "dark_roof_pct": <integer 0-100, % of visible rooftops that are dark-colored>,
  "light_roof_pct": <integer 0-100, % of visible rooftops that are light or white>,
  "green_space_pct": <integer 0-100, % that is parks, lawns, grass, not including tree canopy>,
  "water_pct": <integer 0-100, % covered by water features, ponds, streams>,
  "estimated_uhi_delta_f": <number, estimated degrees F hotter than surrounding rural area>,
  "key_heat_sources": [<3-4 specific features you can see that trap heat, be specific about location>],
  "cooling_assets": [<1-3 existing cooling features visible in the image, or "None identified" if absent>],
  "recommendations": [
    {
      "action": "<specific intervention tied to what you see>",
      "temp_reduction_f": <number, estimated degrees F cooling>,
      "cost_estimate": "<string like '$10,000-$50,000'>",
      "feasibility": "<High|Medium|Low>",
      "trees": <optional integer, number of trees this adds>,
      "cool_roof_pct": <optional integer, % of roofs converted>,
      "green_acres": <optional number, acres of green space added>
    }
  ],
  "confidence": "<high|medium|low>",
  "unreadable": <true if image is not a neighborhood/aerial/street view, false otherwise>
}

Return ONLY the JSON object. No explanation, no markdown.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          maxOutputTokens: 2048,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    const is429 = res.status === 429;
    const is404 = res.status === 404;
    return NextResponse.json({
      unreadable: true,
      _error: is429 ? "rate_limit" : is404 ? "model_not_found" : "gemini_error",
      _detail: errText.slice(0, 200),
    } as Partial<StreetData>, { status: is429 ? 429 : 502 });
  }

  try {
    const json = await res.json();
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!raw) return NextResponse.json({ unreadable: true } as Partial<StreetData>, { status: 422 });
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ unreadable: true } as Partial<StreetData>, { status: 422 });
    const data: StreetData = JSON.parse(match[0]);
    if (data.heat_score == null) return NextResponse.json({ unreadable: true } as Partial<StreetData>, { status: 422 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ unreadable: true } as Partial<StreetData>, { status: 422 });
  }
}
