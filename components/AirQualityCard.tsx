"use client";

import { Wind, Sun, Droplets, AlertTriangle, ExternalLink } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { AirQualityData } from "@/app/api/air-quality/route";

// ── AQI color scale (EPA standard) ───────────────────────────────────────────
function aqiColor(aqi: number) {
  if (aqi <= 50)  return { bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-300", bar: "#34d399", hex: "#34d399" };
  if (aqi <= 100) return { bg: "bg-yellow-500/15",  border: "border-yellow-500/30",  text: "text-yellow-300",  bar: "#facc15", hex: "#facc15" };
  if (aqi <= 150) return { bg: "bg-orange-500/15",  border: "border-orange-500/30",  text: "text-orange-300",  bar: "#fb923c", hex: "#fb923c" };
  if (aqi <= 200) return { bg: "bg-red-500/15",     border: "border-red-500/30",     text: "text-red-300",     bar: "#f87171", hex: "#f87171" };
  if (aqi <= 300) return { bg: "bg-purple-500/15",  border: "border-purple-500/30",  text: "text-purple-300",  bar: "#c084fc", hex: "#c084fc" };
  return                 { bg: "bg-rose-900/15",    border: "border-rose-900/30",    text: "text-rose-300",    bar: "#fb7185", hex: "#fb7185" };
}

// ── UV color scale ────────────────────────────────────────────────────────────
function uvColor(uv: number) {
  if (uv < 3)  return { text: "text-emerald-300", hex: "#34d399" };
  if (uv < 6)  return { text: "text-yellow-300",  hex: "#facc15" };
  if (uv < 8)  return { text: "text-orange-300",  hex: "#fb923c" };
  if (uv < 11) return { text: "text-red-400",     hex: "#f87171" };
  return              { text: "text-purple-400",   hex: "#c084fc" };
}

function StatBox({
  label, value, sub, textClass,
}: { label: string; value: string; sub?: string; textClass: string }) {
  return (
    <div className="bg-black/20 rounded-xl px-4 py-3 text-center">
      <div className={`text-xl font-black ${textClass}`}>{value}</div>
      <div className="text-[10px] text-slate-600 mt-0.5 uppercase tracking-wide">{label}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

interface Props {
  data: AirQualityData;
  loading?: boolean;
}

export default function AirQualityCard({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-48 mb-5" />
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl" />)}
        </div>
        <div className="h-32 bg-white/5 rounded-xl" />
      </div>
    );
  }

  const ac = aqiColor(data.aqi);
  const uc = uvColor(data.peak_uv);

  // Safe outdoor window label
  const safeHrs = data.safe_outdoor_hours;
  let safeWindow = "All day";
  if (safeHrs.length === 0) {
    safeWindow = "No safe window today";
  } else if (safeHrs.length < 24) {
    const first = safeHrs[0];
    const last  = safeHrs[safeHrs.length - 1];
    const fmt = (h: number) => h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
    safeWindow = `Before ${fmt(first > last ? first : safeHrs.find((h, i) => safeHrs[i + 1] !== h + 1) ?? last + 1)} & after ${fmt(last + 1)}`;
  }

  const pm25Who = 15; // WHO annual guideline µg/m³

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
      {/* NWS heat alerts */}
      {data.nws_alerts.map((alert, i) => (
        <div key={i} className="flex items-start gap-3 bg-red-500/10 border-b border-red-500/20 px-5 py-3">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-black text-red-300 mr-2">{alert.event}</span>
            <span className="text-xs text-red-400/80 leading-snug">{alert.headline}</span>
          </div>
          <a
            href="https://www.weather.gov"
            target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-red-400/60 hover:text-red-300 flex items-center gap-0.5 shrink-0"
          >
            NWS <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      ))}

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/5 flex items-start gap-3">
        <div className="flex-1">
          <h2 className="text-base font-black text-white leading-none mb-0.5">Live Outdoor Conditions</h2>
          <p className="text-xs text-slate-500">Air quality and UV radiation · Open-Meteo CAMS model</p>
        </div>
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${ac.bg} ${ac.border} ${ac.text} uppercase tracking-wide shrink-0`}>
          AQI {data.aqi_category}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Stat row */}
        <div className="grid grid-cols-3 gap-2">
          <StatBox
            label="US AQI"
            value={String(data.aqi)}
            sub={data.aqi_category}
            textClass={ac.text}
          />
          <StatBox
            label="PM2.5"
            value={`${data.pm25}`}
            sub={`µg/m³ · WHO limit ${pm25Who}`}
            textClass={data.pm25 > pm25Who ? "text-orange-300" : "text-emerald-300"}
          />
          <StatBox
            label="Ozone"
            value={`${data.ozone_ug}`}
            sub="µg/m³"
            textClass="text-cyan-300"
          />
        </div>

        {/* UV section */}
        <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 bg-black/10 border-white/5`}>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Sun className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-black ${uc.text}`}>{data.peak_uv}</span>
                <span className="text-xs text-slate-500">peak UV today</span>
              </div>
              <div className="text-xs text-slate-400">{uvColor(data.peak_uv).text.replace("text-", "").replace("-300","").replace("-400","") !== "" ? data.uv_category : data.uv_category}</div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-black/20 rounded-lg px-3 py-2">
              <div className="text-slate-500 mb-0.5">Unprotected burn time</div>
              <div className="font-black text-white">
                {data.uv_burn_min != null ? `~${data.uv_burn_min} min` : "No UV today"}
              </div>
            </div>
            <div className="bg-black/20 rounded-lg px-3 py-2">
              <div className="text-slate-500 mb-0.5">Low-UV window</div>
              <div className="font-black text-white text-[11px] leading-tight">{safeWindow}</div>
            </div>
          </div>
        </div>

        {/* AQI + UV hourly chart */}
        <div>
          <div className="flex items-center justify-between mb-2 text-[10px] text-slate-600 uppercase tracking-wide">
            <span>AQI today (hourly)</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" />0-50 Good</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-400 inline-block" />51-100 Moderate</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-400 inline-block" />101+ Unhealthy</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={data.hourly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={8}>
              <XAxis
                dataKey="label"
                tick={{ fill: "#475569", fontSize: 9 }}
                interval={3}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide domain={[0, Math.max(200, ...data.hourly.map(h => h.aqi))]} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px" }}
                labelStyle={{ color: "#94a3b8", fontSize: 10 }}
                formatter={(v) => [`AQI ${v}`, ""]}
                labelFormatter={(l) => l}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar dataKey="aqi" radius={[2, 2, 0, 0]}>
                {data.hourly.map((entry, i) => (
                  <Cell key={i} fill={aqiColor(entry.aqi).hex} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* UV index hourly chart */}
        <div>
          <div className="text-[10px] text-slate-600 uppercase tracking-wide mb-2">UV Index today (hourly)</div>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={data.hourly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={8}>
              <XAxis
                dataKey="label"
                tick={{ fill: "#475569", fontSize: 9 }}
                interval={3}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide domain={[0, Math.max(12, ...data.hourly.map(h => h.uv))]} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px" }}
                labelStyle={{ color: "#94a3b8", fontSize: 10 }}
                formatter={(v) => [`UV ${v}`, ""]}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar dataKey="uv" radius={[2, 2, 0, 0]}>
                {data.hourly.map((entry, i) => (
                  <Cell key={i} fill={uvColor(entry.uv).hex} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attribution row */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 pt-1 border-t border-white/5">
          <Wind className="h-3 w-3" />
          <span>PM2.5 and ozone from Copernicus Atmosphere Monitoring Service (CAMS) via Open-Meteo</span>
          <span className="mx-1">·</span>
          <Droplets className="h-3 w-3" />
          <span>WHO PM2.5 annual guideline: 5 µg/m³</span>
        </div>
      </div>
    </div>
  );
}
