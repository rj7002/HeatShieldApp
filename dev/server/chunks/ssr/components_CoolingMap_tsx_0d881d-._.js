module.exports = [
"[project]/components/CoolingMap.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CoolingMap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
const TYPE_EMOJI = {
    Library: "📚",
    "Community Center": "🏢",
    Pool: "🏊",
    "Park / Shade": "🌳",
    "Social Services": "🤝",
    Cinema: "🎬",
    "Shopping Mall": "🏬",
    "Recreation Center": "🏋️",
    "House of Worship": "⛪"
};
const TYPE_COLOR = {
    Library: "#3b82f6",
    "Community Center": "#8b5cf6",
    Pool: "#06b6d4",
    "Park / Shade": "#10b981",
    "Social Services": "#f59e0b",
    Cinema: "#ec4899",
    "Shopping Mall": "#6366f1",
    "Recreation Center": "#14b8a6",
    "House of Worship": "#a78bfa"
};
const MAP_STYLES = `
  @keyframes hs-ring-out {
    0%   { transform:translate(-50%,-50%) scale(1);   opacity:.6; }
    100% { transform:translate(-50%,-50%) scale(2.8); opacity:0; }
  }
  @keyframes hs-heat-breathe {
    0%,100% { opacity:.75; }
    50%      { opacity:1; }
  }
  .hs-leaflet-popup .leaflet-popup-content-wrapper {
    background: rgba(15,23,42,0.95) !important;
    color: #e2e8f0 !important;
    border: 1px solid rgba(255,255,255,0.12) !important;
    border-radius: 12px !important;
    backdrop-filter: blur(8px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
  }
  .hs-leaflet-popup .leaflet-popup-tip { background: rgba(15,23,42,0.95) !important; }
  .hs-leaflet-popup .leaflet-popup-close-button { color: #94a3b8 !important; }
`;
function CoolingMap({ lat, lng, city, centers, uhiDelta = 3, tempF }) {
    const mapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mapInstanceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!mapRef.current || mapInstanceRef.current) return;
        __turbopack_context__.A("[project]/node_modules/leaflet/dist/leaflet-src.js [app-ssr] (ecmascript, async loader)").then((L)=>{
            if (!mapRef.current || mapInstanceRef.current) return;
            // Inject styles once
            if (!document.getElementById("hs-map-css")) {
                const s = document.createElement("style");
                s.id = "hs-map-css";
                s.textContent = MAP_STYLES;
                document.head.appendChild(s);
            }
            // Fix default icon paths broken by webpack
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
            });
            const map = L.map(mapRef.current, {
                zoomControl: false
            }).setView([
                lat,
                lng
            ], 14);
            mapInstanceRef.current = map;
            L.control.zoom({
                position: "bottomright"
            }).addTo(map);
            // ── Tile layer: OSM + CSS dark filter (no API key needed) ──────────────
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19
            }).addTo(map);
            // Darken the tile pane so heat colors pop
            const tilePane = map.getPane("tilePane");
            if (tilePane) {
                tilePane.style.filter = "brightness(0.22) saturate(0.15) contrast(1.15)";
            }
            // ── Heat glow overlay (CSS radial-gradient div anchored to lat/lng) ────
            const intensity = Math.min(1, uhiDelta / 10);
            const baseRadius = 160 + uhiDelta * 18; // px at zoom 14
            const heatGlow = document.createElement("div");
            heatGlow.style.cssText = `
        position:absolute;
        border-radius:50%;
        pointer-events:none;
        background: radial-gradient(circle,
          rgba(239,68,68,${(0.1 + intensity * 0.2).toFixed(2)}) 0%,
          rgba(249,115,22,${(0.07 + intensity * 0.13).toFixed(2)}) 28%,
          rgba(234,179,8,${(0.03 + intensity * 0.07).toFixed(2)}) 55%,
          transparent 75%);
        transform:translate(-50%,-50%);
        animation:hs-heat-breathe ${3 + uhiDelta * 0.2}s ease-in-out infinite;
        z-index:2;
      `;
            map.getContainer().appendChild(heatGlow);
            function updateGlow() {
                const pt = map.latLngToContainerPoint([
                    lat,
                    lng
                ]);
                const zf = Math.pow(2, map.getZoom() - 14);
                const r = baseRadius * zf;
                heatGlow.style.width = `${r * 2}px`;
                heatGlow.style.height = `${r * 2}px`;
                heatGlow.style.left = `${pt.x}px`;
                heatGlow.style.top = `${pt.y}px`;
            }
            updateGlow();
            map.on("move zoom moveend zoomend", updateGlow);
            // ── User location — pulsing dot + temp badge ───────────────────────────
            const tempBadge = tempF ? `<div style="background:rgba(239,68,68,0.92);color:white;padding:2px 6px;border-radius:6px;font-size:11px;font-weight:900;margin-top:5px;text-align:center;white-space:nowrap;border:1px solid rgba(255,255,255,0.25);box-shadow:0 2px 8px rgba(0,0,0,0.5)">${tempF}°F</div>` : "";
            const userIcon = L.divIcon({
                html: `
          <div style="position:relative;display:inline-flex;flex-direction:column;align-items:center">
            <div style="position:relative;width:18px;height:18px">
              <div style="position:absolute;width:100%;height:100%;border-radius:50%;background:rgba(249,115,22,.35);left:50%;top:50%;animation:hs-ring-out 2.2s ease-out infinite"></div>
              <div style="position:absolute;width:100%;height:100%;border-radius:50%;background:rgba(249,115,22,.25);left:50%;top:50%;animation:hs-ring-out 2.2s ease-out infinite .9s"></div>
              <div style="width:18px;height:18px;background:linear-gradient(135deg,#f97316,#ef4444);border-radius:50%;border:2.5px solid rgba(255,255,255,.95);box-shadow:0 0 14px rgba(249,115,22,.9),0 2px 8px rgba(0,0,0,.5)"></div>
            </div>
            ${tempBadge}
          </div>`,
                iconSize: [
                    18,
                    tempF ? 46 : 18
                ],
                iconAnchor: [
                    9,
                    tempF ? 46 : 9
                ],
                className: ""
            });
            L.marker([
                lat,
                lng
            ], {
                icon: userIcon
            }).addTo(map).bindPopup(`<b style="color:#f97316;font-size:13px">${city}</b>${tempF ? `<br/><span style="font-size:12px"><b style="color:#fca5a5">${tempF}°F</b> · UHI +${uhiDelta}°F above rural</span>` : ""}`, {
                className: "hs-leaflet-popup"
            }).openPopup();
            // ── Cooling center markers — glowing type-colored badges ────────────────
            centers.forEach((c)=>{
                const emoji = TYPE_EMOJI[c.type] ?? "📍";
                const col = TYPE_COLOR[c.type] ?? "#64748b";
                const icon = L.divIcon({
                    html: `<div style="
            background:${col}22;
            border:1.5px solid ${col}99;
            border-radius:10px;
            padding:3px 5px;
            font-size:14px;
            box-shadow:0 0 10px ${col}55,0 2px 6px rgba(0,0,0,.6);
            backdrop-filter:blur(4px);
            white-space:nowrap;
            line-height:1">${emoji}</div>`,
                    iconSize: [
                        32,
                        30
                    ],
                    iconAnchor: [
                        16,
                        15
                    ],
                    className: ""
                });
                L.marker([
                    c.lat,
                    c.lng
                ], {
                    icon
                }).addTo(map).bindPopup(`<b style="color:white;font-size:13px">${c.name}</b>
             <br/><span style="color:#94a3b8;font-size:11px">${c.type}</span>
             ${c.distance_km ? `<br/><b style="color:#60a5fa;font-size:11px">${c.distance_km} km away</b>` : ""}
             ${c.address ? `<br/><span style="color:#64748b;font-size:11px">${c.address}${c.postcode ? " " + c.postcode : ""}</span>` : ""}
             ${c.openingHours ? `<br/><span style="color:#64748b;font-size:11px">Hours: ${c.openingHours}</span>` : ""}
             ${c.phone ? `<br/><a href="tel:${c.phone.replace(/\s/g, "")}" style="color:#60a5fa;font-size:11px">Phone: ${c.phone}</a>` : ""}
             ${c.website ? `<br/><a href="${c.website}" target="_blank" style="color:#60a5fa;font-size:11px">Website</a>` : ""}
             ${c.wheelchair === "yes" ? `<br/><span style="color:#34d399;font-size:11px">Wheelchair accessible</span>` : ""}
             <br/><a href="https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}" target="_blank" style="color:#f97316;font-size:11px;font-weight:bold">→ Get Directions</a>`, {
                    className: "hs-leaflet-popup",
                    maxWidth: 240
                });
            });
            // Fit bounds to show all markers
            if (centers.length > 0) {
                const allPoints = [
                    [
                        lat,
                        lng
                    ],
                    ...centers.map((c)=>[
                            c.lat,
                            c.lng
                        ])
                ];
                map.fitBounds(allPoints, {
                    padding: [
                        50,
                        50
                    ],
                    maxZoom: 15
                });
            }
        });
        return ()=>{
            if (mapInstanceRef.current) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [
        lat,
        lng,
        city,
        centers,
        uhiDelta,
        tempF
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("link", {
                rel: "stylesheet",
                href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            }, void 0, false, {
                fileName: "[project]/components/CoolingMap.tsx",
                lineNumber: 212,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: mapRef,
                className: "w-full rounded-2xl overflow-hidden border border-white/10",
                style: {
                    height: "360px",
                    zIndex: 0
                }
            }, void 0, false, {
                fileName: "[project]/components/CoolingMap.tsx",
                lineNumber: 213,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
];

//# sourceMappingURL=components_CoolingMap_tsx_0d881d-._.js.map