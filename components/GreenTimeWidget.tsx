"use client";

import { Zap, Thermometer, Wind } from "lucide-react";
import type { GreenHour } from "@/app/api/green-times/route";

const TIER_COLOR: Record<string, string> = {
  best: "bg-emerald-500",
  good: "bg-amber-400",
  avoid: "bg-slate-700",
};

export default function GreenTimeWidget({ hours }: { hours: GreenHour[] }) {
  if (!hours.length) return null;

  const bestWindows = hours
    .filter((h) => h.tier === "best")
    .slice(0, 3)
    .map((h) => h.label);

  const hottest = hours.reduce((a, b) => (a.temp_f > b.temp_f ? a : b));
  const coolest = hours.filter((h) => h.tier !== "avoid").sort((a, b) => a.temp_f - b.temp_f)[0];

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-black text-white">Grid Green Time Window</h2>
          <p className="text-xs text-slate-400">
            Best hours to run AC, appliances, and EV charging. When solar peaks, the grid runs cleaner.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-emerald-400">Live</span>
        </div>
      </div>

      {/* 24-hour bar chart */}
      <div className="flex gap-0.5 items-end h-16 mb-2">
        {hours.map((h, i) => (
          <div key={i} className="flex-1">
            <div
              className={`w-full rounded-sm transition-all ${TIER_COLOR[h.tier]} opacity-80 hover:opacity-100`}
              style={{ height: `${Math.max(4, Math.round((h.green_score / 100) * 64))}px` }}
              title={`${h.label}: ${h.green_score} green score, ${h.temp_f}°F`}
            />
          </div>
        ))}
      </div>

      {/* Hour labels (every 6 hours) */}
      <div className="flex justify-between text-xs text-slate-600 mb-5 px-0.5">
        {hours.filter((_, i) => i % 6 === 0).map((h) => (
          <span key={h.hour}>{h.label}</span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-5 flex-wrap">
        {[
          { color: "bg-emerald-500", label: "Solar peak, cleanest grid" },
          { color: "bg-amber-400",   label: "Mixed sources" },
          { color: "bg-slate-700",   label: "Night / fossil base load" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          <p className="text-xs font-black text-emerald-400 mb-1 flex items-center gap-1">
            <Zap className="h-3 w-3" /> Best times to use energy
          </p>
          <p className="text-sm text-white font-bold">{bestWindows.join(", ") || "None today"}</p>
          <p className="text-xs text-slate-500 mt-1">Run AC, laundry, dishwasher</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <p className="text-xs font-black text-amber-400 mb-1 flex items-center gap-1">
            <Thermometer className="h-3 w-3" /> Peak heat hour
          </p>
          <p className="text-sm text-white font-bold">{hottest.label} · {hottest.temp_f}°F</p>
          <p className="text-xs text-slate-500 mt-1">Stay indoors, avoid exertion</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <p className="text-xs font-black text-blue-400 mb-1 flex items-center gap-1">
            <Wind className="h-3 w-3" /> Pre-cool window
          </p>
          <p className="text-sm text-white font-bold">{coolest?.label ?? "N/A"} · {coolest?.temp_f ?? "--"}°F</p>
          <p className="text-xs text-slate-500 mt-1">Cool home before peak heat</p>
        </div>
      </div>

      <p className="text-xs text-slate-700 mt-4 text-center">
        Solar radiation data via Open-Meteo · Grid carbon intensity varies by region and energy mix
      </p>
    </div>
  );
}
