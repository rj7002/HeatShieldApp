"use client";

import { useState } from "react";
import { TreePine } from "lucide-react";

export default function ImpactCalculator({ baseUhi = 5 }: { baseUhi?: number }) {
  const [trees,       setTrees]       = useState(20);
  const [coolRoofPct, setCoolRoofPct] = useState(20);
  const [greenAcres,  setGreenAcres]  = useState(1);

  const tempReduction = parseFloat((trees * 0.05 + coolRoofPct * 0.015 + greenAcres * 0.8).toFixed(1));
  const newUhi   = Math.max(0, parseFloat((baseUhi - tempReduction).toFixed(1)));
  const co2Saved = Math.round(trees * 22 + coolRoofPct * 40);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shrink-0">
          <TreePine className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-black text-white">Community Impact Calculator</h2>
          <p className="text-xs text-slate-500">Estimate how neighborhood interventions reduce heat</p>
        </div>
      </div>

      <div className="space-y-5 mb-6">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold text-slate-300">Trees planted on your block</label>
            <span className="text-sm font-black text-emerald-400">{trees}</span>
          </div>
          <input type="range" min={0} max={100} value={trees} onChange={(e) => setTrees(+e.target.value)}
            className="w-full accent-emerald-400" />
          <p className="text-xs text-slate-600 mt-1">Each tree reduces nearby air temp by ~0.5°F over time</p>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold text-slate-300">Buildings with cool/white roofs</label>
            <span className="text-sm font-black text-blue-400">{coolRoofPct}%</span>
          </div>
          <input type="range" min={0} max={100} value={coolRoofPct} onChange={(e) => setCoolRoofPct(+e.target.value)}
            className="w-full accent-blue-400" />
          <p className="text-xs text-slate-600 mt-1">Reflective roofs reduce surface temps by up to 50°F</p>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold text-slate-300">New green space (acres)</label>
            <span className="text-sm font-black text-violet-400">{greenAcres} ac</span>
          </div>
          <input type="range" min={0} max={10} step={0.5} value={greenAcres} onChange={(e) => setGreenAcres(+e.target.value)}
            className="w-full accent-violet-400" />
          <p className="text-xs text-slate-600 mt-1">Parks cool surrounding areas by 1–4°F/acre</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-black/20 rounded-xl p-4 text-center">
          <div className="text-xl font-black text-emerald-400 mb-0.5">−{tempReduction}°F</div>
          <div className="text-xs text-slate-500">Temp reduction</div>
        </div>
        <div className="bg-black/20 rounded-xl p-4 text-center">
          <div className="text-xl font-black text-amber-400 mb-0.5">{newUhi}°F</div>
          <div className="text-xs text-slate-500">New UHI delta</div>
        </div>
        <div className="bg-black/20 rounded-xl p-4 text-center">
          <div className="text-xl font-black text-blue-400 mb-0.5">{co2Saved}</div>
          <div className="text-xs text-slate-500">lbs CO₂/yr saved</div>
        </div>
      </div>
    </div>
  );
}
