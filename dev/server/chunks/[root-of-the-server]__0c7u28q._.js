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
"[project]/app/api/air-quality/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
function aqiCategory(aqi) {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
}
function uvCategory(uv) {
    if (uv < 3) return "Low";
    if (uv < 6) return "Moderate";
    if (uv < 8) return "High";
    if (uv < 11) return "Very High";
    return "Extreme";
}
// Minutes until sunburn for average (type II) skin with no sunscreen
function burnTime(uv) {
    if (uv < 1) return null;
    return Math.round(133 / uv);
}
async function GET(req) {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") ?? "0");
    const lng = parseFloat(searchParams.get("lng") ?? "0");
    if (!lat || !lng) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "lat/lng required"
    }, {
        status: 400
    });
    // Fetch air quality and UV from Open-Meteo (free, no key)
    const aqRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}` + `&hourly=pm2_5,ozone,us_aqi,uv_index&timezone=auto&forecast_days=1`, {
        next: {
            revalidate: 1800
        },
        signal: AbortSignal.timeout(10_000)
    });
    if (!aqRes.ok) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "air quality fetch failed"
    }, {
        status: 502
    });
    const aqJson = await aqRes.json();
    const times = aqJson.hourly?.time ?? [];
    const pm25Arr = aqJson.hourly?.pm2_5 ?? [];
    const ozoneArr = aqJson.hourly?.ozone ?? [];
    const aqiArr = aqJson.hourly?.us_aqi ?? [];
    const uvArr = aqJson.hourly?.uv_index ?? [];
    // Find current hour index
    const nowStr = new Date().toISOString().slice(0, 13);
    const nowIdx = Math.max(0, times.findIndex((t)=>t.slice(0, 13) >= nowStr));
    const currentAqi = aqiArr[nowIdx] ?? 0;
    const currentPm25 = pm25Arr[nowIdx] ?? 0;
    const currentOzone = ozoneArr[nowIdx] ?? 0;
    const currentUv = uvArr[nowIdx] ?? 0;
    // Peak UV today
    const peakUv = Math.max(...uvArr.slice(0, 24), 0);
    const peakUvHour = uvArr.indexOf(peakUv);
    // Hours where UV < 3 (safe for unprotected exposure)
    const safeHours = uvArr.slice(0, 24).map((v, i)=>({
            v,
            i
        })).filter(({ v })=>v < 3).map(({ i })=>new Date(times[i] ?? "").getHours());
    // Build hourly array for chart (next 24h)
    const hourly = times.slice(0, 24).map((t, i)=>{
        const d = new Date(t);
        const h = d.getHours();
        const ampm = h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
        return {
            hour: h,
            label: ampm,
            aqi: aqiArr[i] ?? 0,
            pm25: pm25Arr[i] ?? 0,
            uv: uvArr[i] ?? 0
        };
    });
    // NWS heat alerts (US only — gracefully fails for other countries)
    const nwsAlerts = [];
    try {
        const nwsRes = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lng}`, {
            signal: AbortSignal.timeout(5_000),
            headers: {
                "User-Agent": "heatshield-app"
            }
        });
        if (nwsRes.ok) {
            const nwsJson = await nwsRes.json();
            const features = nwsJson.features ?? [];
            const HEAT_EVENTS = [
                "Heat",
                "Excessive Heat",
                "Hot",
                "High Temperature"
            ];
            for (const f of features){
                const ev = f.properties.event ?? "";
                if (HEAT_EVENTS.some((k)=>ev.includes(k))) {
                    nwsAlerts.push({
                        event: f.properties.event,
                        headline: f.properties.headline ?? ev,
                        severity: f.properties.severity ?? "Unknown",
                        expires: f.properties.expires ?? ""
                    });
                }
            }
        }
    } catch  {}
    const result = {
        aqi: currentAqi,
        aqi_category: aqiCategory(currentAqi),
        pm25: parseFloat(currentPm25.toFixed(1)),
        ozone_ug: parseFloat(currentOzone.toFixed(0)),
        uv_index: parseFloat(currentUv.toFixed(1)),
        uv_category: uvCategory(currentUv),
        uv_burn_min: burnTime(currentUv),
        peak_uv: parseFloat(peakUv.toFixed(1)),
        peak_uv_hour: peakUvHour,
        safe_outdoor_hours: safeHours,
        hourly,
        nws_alerts: nwsAlerts
    };
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(result);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0c7u28q._.js.map