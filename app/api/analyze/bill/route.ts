import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";
const MODEL = "gemini-2.5-flash-lite"; // confirmed working for vision; 2.5-flash = 20 vision req/day free

export interface BillData {
  kwh_used: number;
  total_cost: number;
  billing_period: string;
  billing_days: number;
  rate_per_kwh: number;
  utility_provider: string;
  address: string | null;
  estimated_cooling_pct: number;
  uhi_premium_pct: number;
  uhi_premium_monthly: number;
  uhi_premium_annual: number;
  national_avg_kwh: number;
  top_actions: { action: string; savings_monthly: number; cost: number; difficulty: "Easy" | "Medium" | "Hard" }[];
  assistance_programs: string[];
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

  const prompt = `You are an expert energy analyst reading a utility bill image.

Extract ALL visible data from this utility bill and return ONLY a valid JSON object with this exact schema. If you cannot read the bill clearly, set unreadable: true and fill in null/0 for unknown fields.

{
  "kwh_used": <number, kWh used this period, 0 if unknown>,
  "total_cost": <number in dollars, 0 if unknown>,
  "billing_period": <string like "June 2024", "unknown" if not visible>,
  "billing_days": <number of days in billing period, 30 if unknown>,
  "rate_per_kwh": <number like 0.14, estimate from total/kwh if not shown>,
  "utility_provider": <string name of utility company, "Unknown" if not visible>,
  "address": <string service address if visible, null if not shown>,
  "estimated_cooling_pct": <integer 0-100, percentage of bill likely for cooling/AC based on season and usage>,
  "uhi_premium_pct": <integer 10-30, estimated % extra cost due to urban heat island, typically 15-25% for dense urban areas>,
  "uhi_premium_monthly": <number, total_cost * uhi_premium_pct/100>,
  "uhi_premium_annual": <number, uhi_premium_monthly * 12>,
  "national_avg_kwh": 900,
  "top_actions": [
    { "action": "<specific action>", "savings_monthly": <dollars>, "cost": <one-time dollars>, "difficulty": "<Easy|Medium|Hard>" },
    { "action": "<specific action>", "savings_monthly": <dollars>, "cost": <one-time dollars>, "difficulty": "<Easy|Medium|Hard>" },
    { "action": "<specific action>", "savings_monthly": <dollars>, "cost": <one-time dollars>, "difficulty": "<Easy|Medium|Hard>" }
  ],
  "assistance_programs": [<2-3 relevant program names as strings>],
  "confidence": "<high|medium|low>",
  "unreadable": <true if image is not a utility bill or completely unreadable, false otherwise>
}

Return ONLY the JSON object. No explanation, no markdown fences.`;

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
    const err = await res.text();
    return NextResponse.json({ error: `Gemini error: ${err}` }, { status: 502 });
  }

  try {
    const json = await res.json();
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const data: BillData = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ unreadable: true } as Partial<BillData>, { status: 422 });
  }
}
