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
"[project]/app/api/historical/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$geocode$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/geocode.ts [app-route] (ecmascript)");
;
;
async function fetchSummerAvg(lat, lng) {
    const end = new Date().getFullYear() - 1;
    const start = end - 19;
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` + `&start_date=${start}-01-01&end_date=${end}-12-31` + `&daily=temperature_2m_max&timezone=auto`;
    const res = await fetch(url, {
        next: {
            revalidate: 86400
        }
    });
    if (!res.ok) throw new Error("Archive API failed");
    const json = await res.json();
    const times = json.daily?.time ?? [];
    const temps = json.daily?.temperature_2m_max ?? [];
    // Average June–August per year
    const sumsByYear = {};
    times.forEach((dateStr, i)=>{
        const d = new Date(dateStr);
        const month = d.getMonth() + 1; // 1-based
        const year = d.getFullYear();
        if (month >= 6 && month <= 8 && temps[i] != null) {
            if (!sumsByYear[year]) sumsByYear[year] = {
                sum: 0,
                count: 0
            };
            sumsByYear[year].sum += temps[i];
            sumsByYear[year].count += 1;
        }
    });
    const avgByYear = {};
    for (const [y, { sum, count }] of Object.entries(sumsByYear)){
        avgByYear[+y] = parseFloat((sum / count * 9 / 5 + 32).toFixed(1));
    }
    return avgByYear;
}
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
    // Use north + south reference points only — averaging two cuts directional bias
    // without 4× the archive fetch (each call is 20 years of daily data).
    const [north, , , south] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$geocode$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ruralReferencePoints"])(lat, lng); // north idx=0, south idx=1
    const [urbanAvgs, northAvgs, southAvgs] = await Promise.all([
        fetchSummerAvg(lat, lng),
        fetchSummerAvg(north.lat, north.lng),
        fetchSummerAvg(south.lat, south.lng)
    ]);
    const years = Object.keys(urbanAvgs).map(Number).sort().map((year)=>{
        const ruralAvgF = northAvgs[year] != null && southAvgs[year] != null ? parseFloat(((northAvgs[year] + southAvgs[year]) / 2).toFixed(1)) : northAvgs[year] ?? southAvgs[year] ?? urbanAvgs[year] - 2;
        return {
            year,
            urban_avg_f: urbanAvgs[year],
            rural_avg_f: ruralAvgF,
            delta_f: parseFloat((urbanAvgs[year] - ruralAvgF).toFixed(1))
        };
    });
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        years
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0z6up7-._.js.map