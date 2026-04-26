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
"[project]/lib/overpass.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "findCoolingCenters",
    ()=>findCoolingCenters
]);
async function findCoolingCenters(centerLat, centerLng, bbox) {
    const b = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
    const query = `
[out:json][timeout:30][bbox:${b}];
(
  node["amenity"="library"];
  node["amenity"="community_centre"];
  node["amenity"="social_facility"];
  node["leisure"="swimming_pool"]["access"!="private"];
  node["amenity"="public_bath"];
  node["leisure"="park"]["name"];
  node["amenity"="rec_centre"];
  node["amenity"="cinema"];
  node["shop"="mall"];
  node["amenity"="place_of_worship"]["name"];
);
out body;
`;
    const endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter"
    ];
    for (const endpoint of endpoints){
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                body: query,
                headers: {
                    "Content-Type": "text/plain",
                    "Accept": "*/*",
                    "User-Agent": "HeatShield/1.0 (hackathon project)"
                }
            });
            if (!res.ok) continue;
            const json = await res.json();
            const centers = (json.elements ?? []).map((el)=>{
                const tags = el.tags ?? {};
                const elLat = el.lat;
                const elLng = el.lon;
                if (!elLat || !elLng) return null;
                const rawType = tags.amenity ?? tags.leisure ?? tags.shop ?? "facility";
                // Normalize phone
                let phone = tags.phone ?? tags["contact:phone"] ?? tags.telephone;
                if (phone) {
                    // Strip OSM formatting quirks (e.g. "+1 555-555-5555")
                    phone = phone.replace(/\s+/g, " ").trim();
                }
                // Normalize website
                let website = tags.website ?? tags["contact:website"] ?? tags.url;
                if (website && !website.startsWith("http")) website = `https://${website}`;
                const wheelchair = tags.wheelchair;
                return {
                    id: el.id,
                    name: tags.name ?? friendlyType(rawType),
                    type: friendlyType(rawType),
                    lat: elLat,
                    lng: elLng,
                    address: buildAddress(tags),
                    postcode: tags["addr:postcode"],
                    openingHours: tags.opening_hours,
                    phone,
                    website,
                    email: tags.email ?? tags["contact:email"],
                    wheelchair: wheelchair && [
                        "yes",
                        "no",
                        "limited"
                    ].includes(wheelchair) ? wheelchair : undefined,
                    operator: tags.operator,
                    distance_km: haversine(centerLat, centerLng, elLat, elLng)
                };
            }).filter(Boolean).sort((a, b)=>(a.distance_km ?? 0) - (b.distance_km ?? 0)).slice(0, 20);
            return centers;
        } catch  {
            continue;
        }
    }
    return [];
}
function friendlyType(raw) {
    const map = {
        library: "Library",
        community_centre: "Community Center",
        social_facility: "Social Services",
        swimming_pool: "Pool",
        public_bath: "Public Bath",
        park: "Park / Shade",
        rec_centre: "Recreation Center",
        cinema: "Cinema",
        mall: "Shopping Mall",
        place_of_worship: "House of Worship"
    };
    return map[raw] ?? raw.replace(/_/g, " ");
}
function buildAddress(tags) {
    const parts = [
        tags["addr:housenumber"],
        tags["addr:street"],
        tags["addr:city"]
    ].filter(Boolean);
    return parts.length ? parts.join(" ") : undefined;
}
function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}
}),
"[project]/app/api/cooling/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$overpass$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/overpass.ts [app-route] (ecmascript)");
;
;
async function GET(req) {
    const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
    const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "");
    const south = parseFloat(req.nextUrl.searchParams.get("south") ?? "");
    const north = parseFloat(req.nextUrl.searchParams.get("north") ?? "");
    const west = parseFloat(req.nextUrl.searchParams.get("west") ?? "");
    const east = parseFloat(req.nextUrl.searchParams.get("east") ?? "");
    if (isNaN(lat) || isNaN(lng)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "lat and lng required"
        }, {
            status: 400
        });
    }
    // Fall back to a default ~5km bbox if callers don't send one
    const bbox = isNaN(south) ? {
        south: lat - 0.045,
        north: lat + 0.045,
        west: lng - 0.045,
        east: lng + 0.045
    } : {
        south,
        north,
        west,
        east
    };
    const centers = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$overpass$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["findCoolingCenters"])(lat, lng, bbox);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        centers
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__05-qu3-._.js.map