import { NextRequest } from "next/server";

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";
const MODEL = "gemini-2.5-flash";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { city, state, risk_score, risk_level, uhi_delta_f, feels_like_f, housing_type, is_renter } = body;

  const prompt = `You are an urban heat resilience advisor helping a resident in ${city}, ${state}.

Situation:
- Urban Heat Island effect: +${uhi_delta_f}°F above rural areas
- Current feels-like temperature: ${feels_like_f}°F
- Heat risk level: ${risk_level} (${risk_score}/10)
- Housing: ${housing_type ?? "unknown"} (${is_renter ? "renter" : "owner"})

Generate a personalized action plan with exactly 3 categories:

## Immediate Actions (next 24 hours)
List 3-4 things they can do RIGHT NOW to stay safe and cool.

## Short-Term Improvements (next 30 days)
List 3-4 affordable interventions: window film, fans, curtains, weatherstripping, utility assistance programs.
${is_renter ? "Focus on renter-friendly options that don't require landlord permission." : "Include home improvement options."}

## Community & Long-Term Impact
List 3-4 actions that reduce UHI for the whole neighborhood: tree planting programs, cool roof initiatives, advocacy, local programs.

For each item, include an estimated impact (e.g., "reduces indoor temp by 2-4°F") and rough cost if applicable.
Be specific, practical, and empowering. No fluff.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1024 },
      }),
    }
  );

  if (!res.ok || !res.body) {
    return new Response("Gemini error", { status: 502 });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json || json === "[DONE]") continue;
          try {
            const chunk = JSON.parse(json);
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          } catch { /* malformed chunk */ }
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
