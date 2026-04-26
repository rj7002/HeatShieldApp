"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import type { ForecastDay } from "@/lib/weather";

interface Props {
  days: ForecastDay[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const urban = payload.find((p: { dataKey: string }) => p.dataKey === "urban_max_f");
  const rural = payload.find((p: { dataKey: string }) => p.dataKey === "rural_max_f");
  const delta = urban && rural ? (urban.value - rural.value).toFixed(1) : null;
  return (
    <div className="bg-slate-900 border border-white/20 rounded-xl p-3 text-xs shadow-2xl">
      <p className="font-bold text-white mb-2">{label}</p>
      {urban && <p className="text-orange-400">Urban: {urban.value}°F</p>}
      {rural && <p className="text-blue-400">Rural ref: {rural.value}°F</p>}
      {delta && <p className="text-red-400 mt-1 font-bold">+{delta}°F UHI effect</p>}
    </div>
  );
}

export default function ForecastChart({ days }: Props) {
  if (!days.length) return null;
  const minY = Math.min(...days.map((d) => d.rural_max_f)) - 5;
  const maxY = Math.max(...days.map((d) => d.urban_max_f)) + 5;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="mb-4">
        <h2 className="text-lg font-black text-white">7-Day Urban vs. Rural Forecast</h2>
        <p className="text-xs text-slate-400">The gap between lines shows the urban heat island effect, live from Open-Meteo.</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={days} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="urbanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ruralGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[minY, maxY]} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}°`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ color: value === "urban_max_f" ? "#f97316" : "#3b82f6", fontSize: 11 }}>
                {value === "urban_max_f" ? "Urban" : "Rural"}
              </span>
            )}
          />
          <Area type="monotone" dataKey="urban_max_f" stroke="#f97316" strokeWidth={2.5} fill="url(#urbanGrad)" dot={{ fill: "#f97316", r: 3 }} activeDot={{ r: 5 }} />
          <Area type="monotone" dataKey="rural_max_f" stroke="#3b82f6" strokeWidth={2} fill="url(#ruralGrad)" dot={{ fill: "#3b82f6", r: 3 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
