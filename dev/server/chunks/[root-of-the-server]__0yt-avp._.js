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
"[project]/lib/geocode.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "geocodeAddress",
    ()=>geocodeAddress,
    "ruralReferencePoints",
    ()=>ruralReferencePoints
]);
async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`;
    const res = await fetch(url, {
        headers: {
            "User-Agent": "HeatShield/1.0 (hackathon project)"
        }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    const r = data[0];
    const addr = r.address ?? {};
    // Nominatim boundingbox: [south, north, west, east]
    const bb = r.boundingbox ?? [];
    const rawBbox = {
        south: parseFloat(bb[0] ?? r.lat - 0.1),
        north: parseFloat(bb[1] ?? r.lat + 0.1),
        west: parseFloat(bb[2] ?? r.lon - 0.1),
        east: parseFloat(bb[3] ?? r.lon + 0.1)
    };
    // Cap bbox to ~0.4° per side (~40 km) so we don't query an entire state
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    const maxDelta = 0.4;
    const bbox = {
        south: Math.max(rawBbox.south, lat - maxDelta),
        north: Math.min(rawBbox.north, lat + maxDelta),
        west: Math.max(rawBbox.west, lng - maxDelta),
        east: Math.min(rawBbox.east, lng + maxDelta)
    };
    return {
        lat,
        lng: parseFloat(r.lon),
        displayName: r.display_name,
        city: addr.city ?? addr.town ?? addr.village ?? addr.county ?? "",
        state: addr.state ?? "",
        country: addr.country ?? "",
        bbox
    };
}
function ruralReferencePoints(lat, lng) {
    const d = 0.225; // ~25 km in latitude degrees
    return [
        {
            lat: lat + d,
            lng
        },
        {
            lat: lat - d,
            lng
        },
        {
            lat,
            lng: lng + d
        },
        {
            lat,
            lng: lng - d
        }
    ];
}
}),
"[project]/lib/weather.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getUrbanAndRuralTemps",
    ()=>getUrbanAndRuralTemps,
    "getWeeklyForecast",
    ()=>getWeeklyForecast
]);
async function fetchOpenMeteo(lat, lng) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` + `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weathercode` + `&temperature_unit=celsius&wind_speed_unit=mph&timezone=auto`;
    const res = await fetch(url, {
        next: {
            revalidate: 300
        }
    });
    if (!res.ok) throw new Error("Open-Meteo fetch failed");
    const json = await res.json();
    const c = json.current;
    const temp_c = c.temperature_2m ?? 0;
    return {
        temp_c,
        temp_f: temp_c * 9 / 5 + 32,
        feels_like_c: c.apparent_temperature ?? temp_c,
        humidity: c.relative_humidity_2m ?? 0,
        description: wmoDescription(c.weathercode ?? 0)
    };
}
async function getUrbanAndRuralTemps(urbanLat, urbanLng, ruralPoints) {
    const [urban, ...ruralResults] = await Promise.all([
        fetchOpenMeteo(urbanLat, urbanLng),
        ...ruralPoints.map((p)=>fetchOpenMeteo(p.lat, p.lng))
    ]);
    const ruralAvgC = ruralResults.reduce((sum, r)=>sum + r.temp_c, 0) / ruralResults.length;
    const uhiDelta = parseFloat((urban.temp_c - ruralAvgC).toFixed(1));
    return {
        urban,
        uhiDelta
    };
}
async function getWeeklyForecast(urbanLat, urbanLng, ruralPoints) {
    const params = "daily=temperature_2m_max,temperature_2m_min&temperature_unit=celsius&timezone=auto&forecast_days=7";
    const [urbanRes, ...ruralResponses] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${urbanLat}&longitude=${urbanLng}&${params}`),
        ...ruralPoints.map((p)=>fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lng}&${params}`))
    ]);
    if (!urbanRes.ok) return [];
    const [u, ...ruralJsons] = await Promise.all([
        urbanRes.json(),
        ...ruralResponses.map((r)=>r.ok ? r.json() : Promise.resolve(null))
    ]);
    const validRurals = ruralJsons.filter(Boolean);
    const days = (u.daily?.time ?? []).map((date, i)=>{
        const urbanMax = u.daily.temperature_2m_max[i] ?? 0;
        const urbanMin = u.daily.temperature_2m_min[i] ?? 0;
        const ruralMaxes = validRurals.map((r)=>r.daily?.temperature_2m_max?.[i] ?? urbanMax);
        const ruralAvgMax = ruralMaxes.reduce((s, v)=>s + v, 0) / (ruralMaxes.length || 1);
        const d = new Date(date);
        return {
            date,
            label: i === 0 ? "Today" : d.toLocaleDateString("en-US", {
                weekday: "short"
            }),
            urban_max_f: parseFloat((urbanMax * 9 / 5 + 32).toFixed(1)),
            rural_max_f: parseFloat((ruralAvgMax * 9 / 5 + 32).toFixed(1)),
            urban_min_f: parseFloat((urbanMin * 9 / 5 + 32).toFixed(1))
        };
    });
    return days;
}
function wmoDescription(code) {
    if (code === 0) return "Clear sky";
    if (code <= 3) return "Partly cloudy";
    if (code <= 9) return "Fog";
    if (code <= 19) return "Drizzle";
    if (code <= 29) return "Rain";
    if (code <= 39) return "Snow";
    if (code <= 49) return "Fog";
    if (code <= 59) return "Drizzle";
    if (code <= 69) return "Rain";
    if (code <= 79) return "Snow";
    if (code <= 84) return "Rain showers";
    if (code <= 94) return "Thunderstorm";
    return "Thunderstorm with hail";
}
}),
"[project]/app/api/heat-profile/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$geocode$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/geocode.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$weather$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/weather.ts [app-route] (ecmascript)");
;
;
;
const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";
const MODEL = "gemini-2.5-flash";
// Deterministic score based on NOAA/NWS Heat Index danger thresholds.
// Source: https://www.weather.gov/ama/heatindex
function computeRisk(feelsLikeF, uhiDeltaF) {
    let score;
    if (feelsLikeF < 75) score = 1;
    else if (feelsLikeF < 80) score = 2; // below NWS Caution
    else if (feelsLikeF < 85) score = 3;
    else if (feelsLikeF < 90) score = 4; // NWS Caution: 80–90 °F
    else if (feelsLikeF < 95) score = 5;
    else if (feelsLikeF < 100) score = 6; // NWS Extreme Caution: 90–103 °F
    else if (feelsLikeF < 103) score = 7;
    else if (feelsLikeF < 115) score = 8; // NWS Danger: 103–124 °F
    else if (feelsLikeF < 125) score = 9;
    else score = 10; // NWS Extreme Danger: 125 °F+
    // City is 7 °F+ hotter than its own rural fringe → bump one tier
    if (uhiDeltaF >= 7) score = Math.min(10, score + 1);
    const level = score <= 2 ? "Low" : score <= 4 ? "Moderate" : score <= 7 ? "High" : "Extreme";
    return {
        score,
        level
    };
}
async function GET(req) {
    const address = req.nextUrl.searchParams.get("address");
    if (!address) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "address param required"
        }, {
            status: 400
        });
    }
    const geo = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$geocode$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geocodeAddress"])(address);
    if (!geo) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Could not geocode address"
        }, {
            status: 404
        });
    }
    const rural = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$geocode$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ruralReferencePoints"])(geo.lat, geo.lng);
    const { urban, uhiDelta } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$weather$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUrbanAndRuralTemps"])(geo.lat, geo.lng, rural);
    const uhi_delta_f = parseFloat((uhiDelta * 9 / 5).toFixed(1));
    const urban_temp_f = parseFloat(urban.temp_f.toFixed(1));
    const rural_temp_f = parseFloat((urban.temp_f - uhi_delta_f).toFixed(1));
    const feels_like_f = parseFloat((urban.feels_like_c * 9 / 5 + 32).toFixed(1));
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
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
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
                maxOutputTokens: 400,
                responseMimeType: "application/json"
            }
        }),
        signal: AbortSignal.timeout(20_000)
    });
    let narrative = {
        risk_factors: [
            "Dense impervious surfaces",
            "Limited tree canopy",
            "Heat-absorbing building materials"
        ],
        vulnerable_groups: [
            "Elderly residents",
            "Outdoor workers",
            "Children",
            "People without AC"
        ],
        health_risks: [
            "Heat exhaustion",
            "Dehydration",
            "Cardiovascular stress"
        ],
        ai_summary: `${geo.city} is experiencing ${level.toLowerCase()} heat conditions with a feels-like temperature of ${feels_like_f}°F and an urban heat island effect of +${uhi_delta_f}°F.`
    };
    try {
        const geminiJson = await geminiRes.json();
        const raw = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
        const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
        if (parsed.ai_summary) narrative = parsed;
    } catch  {}
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        address: geo.displayName,
        city: geo.city,
        state: geo.state,
        lat: geo.lat,
        lng: geo.lng,
        bbox: geo.bbox,
        urban_temp_f,
        rural_temp_f,
        uhi_delta_f,
        humidity: urban.humidity,
        feels_like_f,
        risk_score: score,
        risk_level: level,
        risk_factors: narrative.risk_factors,
        vulnerable_groups: narrative.vulnerable_groups,
        health_risks: narrative.health_risks,
        ai_summary: narrative.ai_summary
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0yt-avp._.js.map