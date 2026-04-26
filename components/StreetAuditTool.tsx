"use client";

import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import { Upload, X, Loader2, MapPin, Thermometer, CheckCircle, AlertTriangle, Search, Satellite } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { StreetData } from "@/app/api/analyze/street/route";

// ── Sub-components ────────────────────────────────────────────────────────────

function InteractiveImpact({ data }: { data: StreetData }) {
  const [trees, setTrees] = useState(0);
  const [coolRoofPct, setCoolRoofPct] = useState(0);
  const [greenAcres, setGreenAcres] = useState(0);

  useEffect(() => {
    let t = 0, r = 0, g = 0;
    for (const rec of data.recommendations) {
      if (rec.trees) t += rec.trees;
      if (rec.cool_roof_pct) r += rec.cool_roof_pct;
      if (rec.green_acres) g += rec.green_acres;
    }
    setTrees(Math.min(t, 100));
    setCoolRoofPct(Math.min(r, 100));
    setGreenAcres(Math.min(g, 10));
  }, [data]);

  const tempReduction = parseFloat((trees * 0.05 + coolRoofPct * 0.015 + greenAcres * 0.8).toFixed(1));
  const newDelta = Math.max(0, parseFloat((data.estimated_uhi_delta_f - tempReduction).toFixed(1)));

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
      <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Impact if Recommendations Implemented</p>
      <p className="text-xs text-slate-500">Pre-filled from AI analysis. Adjust sliders to explore scenarios.</p>
      <div className="space-y-3">
        {[
          { label: "Trees planted", value: trees, set: setTrees, max: 100, step: 1, color: "accent-emerald-400", display: String(trees) },
          { label: "Cool roofs coverage", value: coolRoofPct, set: setCoolRoofPct, max: 100, step: 1, color: "accent-blue-400", display: `${coolRoofPct}%` },
          { label: "New green space", value: greenAcres, set: setGreenAcres, max: 10, step: 0.5, color: "accent-violet-400", display: `${greenAcres} ac` },
        ].map(({ label, value, set, max, step, color, display }) => (
          <div key={label}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-slate-400">{label}</span>
              <span className={`text-xs font-bold ${color.replace("accent-", "text-")}`}>{display}</span>
            </div>
            <input type="range" min={0} max={max} step={step} value={value}
              onChange={(e) => set(+e.target.value)} className={`w-full ${color}`} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">Current UHI delta</div>
          <div className="text-xl font-black text-red-400">+{data.estimated_uhi_delta_f}°F</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">After interventions</div>
          <div className="text-xl font-black text-emerald-400">+{newDelta}°F</div>
        </div>
      </div>
      {tempReduction > 0 && (
        <div className="text-center text-sm font-black text-emerald-400">
          -{tempReduction}°F temperature reduction achievable
        </div>
      )}
    </div>
  );
}

function SurfaceChart({ data }: { data: StreetData }) {
  const chartData = [
    { name: "Pavement/Roads", value: Math.max(0, data.impervious_pct - data.dark_roof_pct - data.light_roof_pct), color: "#64748b" },
    { name: "Dark Roofs",     value: data.dark_roof_pct,    color: "#374151" },
    { name: "Light Roofs",    value: data.light_roof_pct,   color: "#cbd5e1" },
    { name: "Tree Canopy",    value: data.tree_canopy_pct,  color: "#22c55e" },
    { name: "Green Space",    value: data.green_space_pct,  color: "#86efac" },
    { name: "Water",          value: data.water_pct,        color: "#38bdf8" },
  ].filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
          {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 }}
          formatter={(v: unknown) => [`${v}%`, ""]}
        />
        <Legend formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function HeatScoreRing({ score }: { score: number }) {
  const color = score >= 8 ? "#f87171" : score >= 6 ? "#f97316" : score >= 4 ? "#fbbf24" : "#34d399";
  const label = score >= 8 ? "Extreme" : score >= 6 ? "High" : score >= 4 ? "Moderate" : "Low";
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${(score / 10) * 264} 264`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{score}</span>
          <span className="text-xs text-slate-400">/10</span>
        </div>
      </div>
      <span className="text-sm font-black mt-1" style={{ color }}>{label} Heat Risk</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function normalizeStreetData(json: StreetData): StreetData {
  return {
    ...json,
    key_heat_sources: Array.isArray(json.key_heat_sources) ? json.key_heat_sources : [],
    cooling_assets:   Array.isArray(json.cooling_assets)   ? json.cooling_assets   : [],
    recommendations:  Array.isArray(json.recommendations)  ? json.recommendations  : [],
  };
}

export default function StreetAuditTool() {
  const [address, setAddress]   = useState("");
  const [preview, setPreview]   = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(false);
  const [data, setData]         = useState<StreetData | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError]       = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Fetch satellite image from address ──────────────────────────────────────
  async function fetchSatellite() {
    if (!address.trim()) return;
    setFetching(true); setError(""); setData(null); setPreview(null);
    try {
      // Geocode
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
        { headers: { "User-Agent": "HeatShield/1.0" } }
      );
      const geoJson = await geoRes.json();
      if (!geoJson.length) { setError("Address not found. Try a more specific location."); setFetching(false); return; }
      const { lat, lon } = geoJson[0];

      // Fetch satellite image via our proxy
      const satRes = await fetch(`/api/satellite?lat=${lat}&lng=${lon}`);
      if (!satRes.ok) { setError("Could not fetch satellite image."); setFetching(false); return; }
      const blob = await satRes.blob();
      setImageBlob(blob);
      setPreview(URL.createObjectURL(blob));
    } catch {
      setError("Failed to fetch satellite image. Check your connection.");
    }
    setFetching(false);
  }

  // ── Handle manual file upload ───────────────────────────────────────────────
  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setImageBlob(file); setData(null); setError("");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function onDrop(e: DragEvent) { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }
  function onChange(e: ChangeEvent<HTMLInputElement>) { const f = e.target.files?.[0]; if (f) handleFile(f); }

  // ── Run Gemini analysis ─────────────────────────────────────────────────────
  async function analyze() {
    if (!imageBlob) return;
    setLoading(true); setError("");
    const form = new FormData();
    form.append("image", imageBlob, "satellite.png");
    try {
      const res = await fetch("/api/analyze/street", { method: "POST", body: form });
      const json = await res.json() as StreetData & { _error?: string; _detail?: string };
      if (res.status === 429 || json._error === "rate_limit") {
        setError("Gemini API rate limit reached (20 vision req/day on free tier). Try again tomorrow or add billing to your Google AI key.");
        setLoading(false); return;
      }
      if (json._error === "gemini_error" || json._error === "model_not_found") {
        setError(`Gemini API error. Check your GOOGLE_AI_API_KEY. ${json._detail ?? ""}`);
        setLoading(false); return;
      }
      if (json.unreadable) {
        setError("AI couldn't interpret this image. Try a clearer satellite view with individual rooftops visible.");
        setLoading(false); return;
      }
      setData(normalizeStreetData(json));
    } catch {
      setError("Analysis failed. Please try again.");
    }
    setLoading(false);
  }

  function reset() { setImageBlob(null); setPreview(null); setData(null); setError(""); setAddress(""); }

  const feasibilityColor = { High: "text-emerald-400", Medium: "text-amber-400", Low: "text-slate-400" };
  const feasibilityBg    = { High: "bg-emerald-500/10 border-emerald-500/20", Medium: "bg-amber-500/10 border-amber-500/20", Low: "bg-white/5 border-white/10" };

  return (
    <div className="space-y-4">
      {!data && (
        <>
          {/* Address input — primary path */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchSatellite()}
                  placeholder="Enter any address or city…"
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
              </div>
              <button
                onClick={fetchSatellite}
                disabled={fetching || !address.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-500/20 border border-violet-500/30 hover:bg-violet-500/30 disabled:opacity-50 text-violet-300 font-semibold rounded-xl text-sm transition-all shrink-0"
              >
                {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Satellite className="h-4 w-4" />}
                {fetching ? "Fetching…" : "Get Satellite"}
              </button>
            </div>
            <p className="text-[10px] text-slate-600 flex items-center gap-1">
              <Satellite className="h-3 w-3" />
              Auto-fetches a 640×640 satellite image from Esri World Imagery — no screenshot needed
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-slate-700">or upload your own</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Upload drop zone */}
          {!preview ? (
            <div
              onClick={() => inputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-all
                ${dragging ? "border-violet-500/60 bg-violet-500/10" : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"}`}
            >
              <Upload className="h-5 w-5 text-slate-600" />
              <p className="text-xs text-slate-500 text-center">Drop aerial or satellite image here</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Satellite preview" className="w-full max-h-64 object-cover" />
                <div className="absolute top-2 left-2 bg-black/60 rounded-lg px-2 py-1 text-[10px] text-slate-300 flex items-center gap-1">
                  <Satellite className="h-3 w-3" /> Esri World Imagery
                </div>
                <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
              <button
                onClick={analyze}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 disabled:opacity-60 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing with Gemini…</>
                  : <><Search className="h-4 w-4" />Analyze with Gemini</>}
              </button>
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />
        </>
      )}

      {/* ── Results ── */}
      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white">Street Heat Audit</h3>
            <button onClick={reset} className="text-xs text-slate-500 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition-colors">
              New audit
            </button>
          </div>

          {/* Score + surface breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col items-center justify-center">
              <HeatScoreRing score={data.heat_score} />
              <div className="mt-3 text-center">
                <p className="text-xs text-slate-500">Estimated UHI effect</p>
                <p className="text-lg font-black text-orange-400">+{data.estimated_uhi_delta_f}°F</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 mb-2">Surface breakdown</p>
              <SurfaceChart data={data} />
            </div>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Impervious", value: `${data.impervious_pct}%`, icon: "🏙️", color: "text-slate-300" },
              { label: "Tree canopy", value: `${data.tree_canopy_pct}%`, icon: "🌳", color: "text-emerald-400" },
              { label: "Dark roofs", value: `${data.dark_roof_pct}%`, icon: "🏚️", color: "text-orange-400" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <div className="text-xl mb-0.5">{icon}</div>
                <div className={`text-lg font-black ${color}`}>{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>

          {/* Heat sources */}
          {data.key_heat_sources.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Thermometer className="h-3.5 w-3.5" /> Heat sources identified
              </p>
              <ul className="space-y-1">
                {data.key_heat_sources.map((s, i) => (
                  <li key={i} className="text-sm text-slate-300 flex gap-2">
                    <span className="text-red-400 shrink-0">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cooling assets */}
          {data.cooling_assets.length > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> Cooling assets present
              </p>
              <ul className="space-y-1">
                {data.cooling_assets.map((s, i) => (
                  <li key={i} className="text-sm text-slate-300 flex gap-2">
                    <span className="text-emerald-400 shrink-0">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <div>
              <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3">Recommended Interventions</p>
              <div className="space-y-2">
                {data.recommendations.map((rec, i) => (
                  <div key={i} className={`border rounded-xl p-4 ${feasibilityBg[rec.feasibility]}`}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="text-sm font-bold text-white">{rec.action}</p>
                      <div className="flex flex-col items-end shrink-0 gap-0.5">
                        <span className={`text-xs font-bold ${feasibilityColor[rec.feasibility]}`}>
                          {rec.feasibility} feasibility
                        </span>
                        <span className="text-orange-400 text-sm font-black">-{rec.temp_reduction_f}°F</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">Est. cost: {rec.cost_estimate}</p>
                      <AlertTriangle className={`h-3.5 w-3.5 ${rec.feasibility === "Low" ? "text-slate-600" : "hidden"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <InteractiveImpact data={data} />

          <p className="text-xs text-center text-slate-700">
            Analysis confidence: {data.confidence} · Esri World Imagery + Google Gemini 2.5
          </p>
        </div>
      )}
    </div>
  );
}
