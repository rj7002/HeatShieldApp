import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";
const MODEL = "gemini-2.5-flash";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, context } = body as {
    messages: { role: "user" | "assistant"; content: string }[];
    context: {
      city: string;
      state: string;
      urban_temp_f: number;
      rural_temp_f: number;
      uhi_delta_f: number;
      feels_like_f: number;
      humidity: number;
      risk_score: number;
      risk_level: string;
      best_hours?: string;
    };
  };

  const systemInstruction = `You are HeatShield's AI heat safety assistant. You have real-time data for the user's location.

CURRENT CONDITIONS - ${context.city}${context.state ? `, ${context.state}` : ""}:
- Urban temperature: ${context.urban_temp_f}°F
- Rural reference: ${context.rural_temp_f}°F
- Urban Heat Island effect: +${context.uhi_delta_f}°F above surrounding areas
- Feels like: ${context.feels_like_f}°F
- Humidity: ${context.humidity}%
- Heat risk score: ${context.risk_score}/10 (${context.risk_level})
${context.best_hours ? `- Best hours for outdoor activity / energy use today: ${context.best_hours}` : ""}

Answer questions about heat safety, cooling strategies, when to go outside, health risks, and local resources.
Be direct, practical, and empathetic. Keep answers concise (2-4 sentences) unless a detailed breakdown is genuinely helpful.
Never recommend emergency services casually - only for genuine life-threatening situations.`;

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { maxOutputTokens: 512 },
      }),
    }
  );

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "unknown");
    console.error("Gemini chat error:", res.status, errText);
    const encoder2 = new TextEncoder();
    const errStream = new ReadableStream({
      start(c) { c.enqueue(encoder2.encode(`Sorry, I'm having trouble connecting right now. (${res.status})`)); c.close(); }
    });
    return new NextResponse(errStream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
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

  return new NextResponse(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
