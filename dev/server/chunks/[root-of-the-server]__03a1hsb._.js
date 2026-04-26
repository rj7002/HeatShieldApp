module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/api/conditions-brief/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";
const MODEL = "gemini-2.5-flash";
async function POST(req) {
    const body = await req.json();
    const { city, state, urban_temp_f, feels_like_f, uhi_delta_f, humidity, aqi, aqi_category, pm25, ozone_ug, uv_peak, uv_category, uv_burn_min, forecast_high_f, forecast_low_f, risk_level } = body;
    const prompt = `You are a heat safety scientist writing a concise real-time outdoor conditions brief for a resident of ${city}${state ? `, ${state}` : ""}.

Today's measured data:
- Temperature: ${urban_temp_f}°F (feels like ${feels_like_f}°F, humidity ${humidity}%)
- Urban Heat Island: +${uhi_delta_f}°F warmer than surrounding rural areas
- US Air Quality Index: ${aqi} (${aqi_category}) — PM2.5: ${pm25} µg/m³, ozone: ${ozone_ug} µg/m³
- Peak UV index: ${uv_peak} (${uv_category}) — unprotected exposure unsafe after ${uv_burn_min ?? "N/A"} minutes
- Forecast: high ${forecast_high_f}°F / low ${forecast_low_f}°F
- Overall heat risk: ${risk_level}

Write a 3–4 sentence outdoor safety brief that synthesizes the compound effect of these factors. Be specific about the numbers. Explain how heat, air quality, and UV interact — for example, how ozone worsens with high temps, or how humidity amplifies heat stress. End with the single most time-specific piece of advice (e.g. which hours are safest). No bullet points, no headers, no preamble. Write directly to the resident.`;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                maxOutputTokens: 256
            }
        })
    });
    if (!res.ok || !res.body) {
        return new Response("", {
            status: 502
        });
    }
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
        async start (controller) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            while(true){
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, {
                    stream: true
                });
                const lines = buf.split("\n");
                buf = lines.pop() ?? "";
                for (const line of lines){
                    if (!line.startsWith("data: ")) continue;
                    const json = line.slice(6).trim();
                    if (!json || json === "[DONE]") continue;
                    try {
                        const chunk = JSON.parse(json);
                        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
                        if (text) controller.enqueue(encoder.encode(text));
                    } catch  {}
                }
            }
            controller.close();
        }
    });
    return new Response(readable, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8"
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__03a1hsb._.js.map