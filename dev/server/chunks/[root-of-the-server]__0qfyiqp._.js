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
"[project]/app/api/forecast/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$weather$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/weather.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$geocode$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/geocode.ts [app-route] (ecmascript)");
;
;
;
async function GET(req) {
    const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
    const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "");
    if (isNaN(lat) || isNaN(lng)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "lat and lng required"
        }, {
            status: 400
        });
    }
    const rural = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$geocode$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ruralReferencePoints"])(lat, lng);
    const days = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$weather$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getWeeklyForecast"])(lat, lng, rural);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        days
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0qfyiqp._.js.map