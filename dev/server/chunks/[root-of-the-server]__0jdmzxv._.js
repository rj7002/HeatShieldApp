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
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/api/analyze/street/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";
const MODEL = "gemini-2.5-flash-lite"; // confirmed working for vision; 2.5-flash = 20 vision req/day free
async function POST(req) {
    const form = await req.formData();
    const file = form.get("image");
    if (!file) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "No image"
    }, {
        status: 400
    });
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = file.type || "image/jpeg";
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
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
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
                            inlineData: {
                                mimeType,
                                data: base64
                            }
                        },
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                maxOutputTokens: 2048
            }
        }),
        signal: AbortSignal.timeout(30_000)
    });
    if (!res.ok) {
        const errText = await res.text();
        const is429 = res.status === 429;
        const is404 = res.status === 404;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            unreadable: true,
            _error: is429 ? "rate_limit" : is404 ? "model_not_found" : "gemini_error",
            _detail: errText.slice(0, 200)
        }, {
            status: is429 ? 429 : 502
        });
    }
    try {
        const json = await res.json();
        const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (!raw) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            unreadable: true
        }, {
            status: 422
        });
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            unreadable: true
        }, {
            status: 422
        });
        const data = JSON.parse(match[0]);
        if (data.heat_score == null) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            unreadable: true
        }, {
            status: 422
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(data);
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            unreadable: true
        }, {
            status: 422
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0jdmzxv._.js.map