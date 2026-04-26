"use client";

import { useEffect, useState } from "react";

interface Props {
  urbanF: number;
  ruralF: number;
  deltaF: number;
  feelsLikeF: number;
  humidity: number;
}

function AnimatedBar({ value, max, color, delay }: { value: number; max: number; color: string; delay: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((value / max) * 100), delay);
    return () => clearTimeout(t);
  }, [value, max, delay]);
  return (
    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const steps = 40;
    const step = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setVal(target); clearInterval(timer); }
      else setVal(parseFloat(current.toFixed(1)));
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <>{val}{suffix}</>;
}

export default function TempCompare({ urbanF, ruralF, deltaF, feelsLikeF, humidity }: Props) {
  const maxTemp = Math.max(urbanF, ruralF, feelsLikeF) + 10;
  const humidityLabel = humidity > 70 ? "High, raises heat index significantly" : humidity > 50 ? "Moderate" : "Low (dry heat)";

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
      <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Live Temperature Breakdown</h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500 inline-block" />
              Urban (your area)
            </span>
            <span className="text-sm font-black text-orange-400">
              <AnimatedNumber target={urbanF} suffix="°F" />
            </span>
          </div>
          <AnimatedBar value={urbanF} max={maxTemp} color="bg-gradient-to-r from-orange-500 to-red-500" delay={100} />
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
              Rural reference (25 km away)
            </span>
            <span className="text-sm font-black text-blue-400">
              <AnimatedNumber target={ruralF} suffix="°F" />
            </span>
          </div>
          <AnimatedBar value={ruralF} max={maxTemp} color="bg-gradient-to-r from-blue-500 to-cyan-400" delay={300} />
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
              Feels like (heat index)
            </span>
            <span className="text-sm font-black text-rose-400">
              <AnimatedNumber target={feelsLikeF} suffix="°F" />
            </span>
          </div>
          <AnimatedBar value={feelsLikeF} max={maxTemp} color="bg-gradient-to-r from-rose-500 to-pink-500" delay={500} />
        </div>
      </div>

      <div className="border-t border-white/10" />

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-red-400 mb-0.5">
            +<AnimatedNumber target={deltaF} suffix="°F" />
          </div>
          <div className="text-xs text-slate-400">Urban heat island effect</div>
          <div className="text-xs text-slate-500 mt-1">vs. surrounding countryside</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-blue-400 mb-0.5">
            <AnimatedNumber target={humidity} suffix="%" />
          </div>
          <div className="text-xs text-slate-400">Humidity</div>
          <div className="text-xs text-slate-500 mt-1">{humidityLabel}</div>
        </div>
      </div>
    </div>
  );
}
