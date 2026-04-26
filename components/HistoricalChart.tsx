"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import type { HistoricalYear } from "@/app/api/historical/route";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const urban = payload.find((p: { dataKey: string }) => p.dataKey === "urban_avg_f");
  const rural = payload.find((p: { dataKey: string }) => p.dataKey === "rural_avg_f");
  return (
    <div className="bg-slate-900 border border-white/20 rounded-xl p-3 text-xs shadow-2xl">
      <p className="font-black text-white mb-2">Summer {label}</p>
      {urban && <p className="text-orange-400">Urban: {urban.value}°F</p>}
      {rural && <p className="text-blue-400">Rural: {rural.value}°F</p>}
      {urban && rural && (
        <p className="text-red-400 font-bold mt-1">+{(urban.value - rural.value).toFixed(1)}°F UHI</p>
      )}
    </div>
  );
}

export default function HistoricalChart({ years }: { years: HistoricalYear[] }) {
  if (!years.length) return null;

  const first = years[0];
  const last  = years[years.length - 1];
  const urbanRise  = (last.urban_avg_f - first.urban_avg_f).toFixed(1);
  const isRising   = last.urban_avg_f > first.urban_avg_f;
  const uhiGrowth  = parseFloat((last.delta_f - first.delta_f).toFixed(1));

  const minY = Math.min(...years.map((y) => y.rural_avg_f)) - 2;
  const maxY = Math.max(...years.map((y) => y.urban_avg_f)) + 3;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-black text-white">20-Year Temperature Trend</h2>
          <p className="text-xs text-slate-500 mt-0.5">Average summer (Jun-Aug) highs, Open-Meteo archive</p>
        </div>
        <div className={`shrink-0 text-center px-4 py-2 rounded-xl border ${isRising ? "bg-red-500/10 border-red-500/30" : "bg-emerald-500/10 border-emerald-500/30"}`}>
          <div className={`text-xl font-black ${isRising ? "text-red-400" : "text-emerald-400"}`}>
            {isRising ? "+" : ""}{urbanRise}°F
          </div>
          <div className="text-xs text-slate-500">since {first.year}</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={years} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="year"
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false} tickLine={false}
            tickFormatter={(v) => `'${String(v).slice(2)}`}
          />
          <YAxis
            domain={[minY, maxY]}
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false} tickLine={false}
            tickFormatter={(v) => `${v}°`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(v) => (
            <span style={{ color: v === "urban_avg_f" ? "#f97316" : "#3b82f6", fontSize: 11 }}>
              {v === "urban_avg_f" ? "Urban" : "Rural"}
            </span>
          )} />
          <Line
            type="monotone" dataKey="urban_avg_f"
            stroke="#f97316" strokeWidth={2.5}
            dot={{ fill: "#f97316", r: 2.5 }} activeDot={{ r: 5 }}
          />
          <Line
            type="monotone" dataKey="rural_avg_f"
            stroke="#3b82f6" strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 2 }} activeDot={{ r: 4 }}
            strokeDasharray="5 3"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: `${first.year} UHI delta`, value: `+${first.delta_f}°F`, color: "text-slate-300" },
          { label: `${last.year} UHI delta`,  value: `+${last.delta_f}°F`,  color: "text-orange-400" },
          {
            label: "UHI trend",
            value: `${uhiGrowth > 0 ? "+" : ""}${uhiGrowth}°F`,
            color: uhiGrowth > 0 ? "text-red-400" : "text-emerald-400",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-black/20 rounded-xl p-3 text-center">
            <div className={`text-lg font-black ${color}`}>{value}</div>
            <div className="text-xs text-slate-600">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
