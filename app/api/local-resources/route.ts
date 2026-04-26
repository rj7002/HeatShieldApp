import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";
const MODEL = "gemini-2.5-flash";

export interface GroundingChunk {
  title: string;
  uri: string;
}

export interface LocalResourcesData {
  text: string;
  sources: GroundingChunk[];
}

export async function POST(req: NextRequest) {
  const { city, state } = await req.json();

  const prompt = `Find specific heat assistance resources for residents of ${city}${state ? `, ${state}` : ""}. Search for:
1. Local utility bill assistance programs (LIHEAP or city-specific)
2. Official city/county heat emergency hotlines or 311 heat services
3. Any current heat emergency declarations or cooling initiatives

Format your response as a short list. For each item include the program name, what it does, and contact info (phone or website) if available. Be specific to ${city} — not generic national programs. If you cannot find local-specific results, say so clearly.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: { maxOutputTokens: 800 },
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Gemini search failed" }, { status: 502 });
  }

  const json = await res.json();
  const candidate = json.candidates?.[0];
  const text: string = candidate?.content?.parts?.[0]?.text ?? "";

  // Extract grounding sources from metadata
  const chunks = (candidate?.groundingMetadata?.groundingChunks ?? []) as {
    web?: { title?: string; uri?: string };
  }[];
  const sources: GroundingChunk[] = chunks
    .filter((c) => c.web?.uri)
    .map((c) => ({ title: c.web?.title ?? c.web?.uri ?? "", uri: c.web!.uri! }))
    .slice(0, 6);

  return NextResponse.json({ text, sources } satisfies LocalResourcesData);
}
