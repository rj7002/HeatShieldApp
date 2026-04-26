"use client";

import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2, Receipt, TrendingDown, DollarSign, Zap, ExternalLink } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { BillData } from "@/app/api/analyze/bill/route";

function AnimatedNumber({ target, prefix = "", suffix = "", decimals = 0 }: { target: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const steps = 40;
    const step = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setVal(target); clearInterval(timer); }
      else setVal(current);
    }, 25);
    return () => clearInterval(timer);
  }, [target]);
  return <>{prefix}{decimals > 0 ? val.toFixed(decimals) : Math.round(val)}{suffix}</>;
}

function UsageChart({ kwh, nationalAvg }: { kwh: number; nationalAvg: number }) {
  const data = [
    { name: "Your Usage", kwh, fill: kwh > nationalAvg ? "#f97316" : "#34d399" },
    { name: "US Average", kwh: nationalAvg, fill: "#3b82f6" },
  ];
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
          formatter={(v: unknown) => [`${v} kWh`, ""]}
          labelStyle={{ color: "#fff", fontWeight: "bold" }}
        />
        <Bar dataKey="kwh" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface Props { }

export default function BillScannerTool({ }: Props) {
  const router = useRouter();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BillData | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setImage(file); setData(null); setError("");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function onDrop(e: DragEvent) { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }
  function onChange(e: ChangeEvent<HTMLInputElement>) { const f = e.target.files?.[0]; if (f) handleFile(f); }

  async function analyze() {
    if (!image) return;
    setLoading(true); setError("");
    const form = new FormData();
    form.append("image", image);
    try {
      const res = await fetch("/api/analyze/bill", { method: "POST", body: form });
      const json: BillData = await res.json();
      if (json.unreadable) { setError("Couldn't read this as a utility bill. Try a clearer photo."); setLoading(false); return; }
      setData(json);
    } catch {
      setError("Analysis failed. Please try again.");
    }
    setLoading(false);
  }

  function reset() { setImage(null); setPreview(null); setData(null); setError(""); }

  const diffPct = data ? Math.round(((data.kwh_used - data.national_avg_kwh) / data.national_avg_kwh) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      {!data && (
        <>
          {!preview ? (
            <div
              onClick={() => inputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all
                ${dragging ? "border-amber-500/60 bg-amber-500/10" : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"}`}
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-amber-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white mb-1">Drop your utility bill here</p>
                <p className="text-xs text-slate-500">Photo or screenshot of any electricity, gas, or water bill</p>
              </div>
              <Upload className="h-4 w-4 text-slate-600" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Bill preview" className="w-full max-h-56 object-cover" />
                <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
              <button
                onClick={analyze}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-60 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Extracting bill data…</> : "Analyze Bill →"}
              </button>
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />
        </>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">{data.utility_provider} · {data.billing_period}</p>
              <h3 className="text-xl font-black text-white">Bill Analysis Complete</h3>
            </div>
            <button onClick={reset} className="text-xs text-slate-500 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition-colors">
              New scan
            </button>
          </div>

          {/* Top stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <Zap className="h-4 w-4 text-amber-400 mx-auto mb-1" />
              <div className="text-xl font-black text-amber-400"><AnimatedNumber target={data.kwh_used} suffix=" kWh" /></div>
              <div className="text-xs text-slate-500">This period</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <DollarSign className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
              <div className="text-xl font-black text-emerald-400"><AnimatedNumber target={data.total_cost} prefix="$" decimals={2} /></div>
              <div className="text-xs text-slate-500">Total bill</div>
            </div>
            <div className={`border rounded-xl p-4 text-center ${diffPct > 0 ? "bg-red-500/10 border-red-500/30" : "bg-emerald-500/10 border-emerald-500/30"}`}>
              <TrendingDown className={`h-4 w-4 mx-auto mb-1 ${diffPct > 0 ? "text-red-400 rotate-180" : "text-emerald-400"}`} />
              <div className={`text-xl font-black ${diffPct > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {diffPct > 0 ? "+" : ""}{diffPct}%
              </div>
              <div className="text-xs text-slate-500">vs national avg</div>
            </div>
          </div>

          {/* Usage chart */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-400 mb-3">Your usage vs. national average</p>
            <UsageChart kwh={data.kwh_used} nationalAvg={data.national_avg_kwh} />
          </div>

          {/* UHI premium — the key insight */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
            <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-2">Urban Heat Island Tax</p>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-4xl font-black text-red-400">
                <AnimatedNumber target={data.uhi_premium_monthly} prefix="$" />
              </span>
              <span className="text-slate-400 text-sm mb-1">/month extra</span>
            </div>
            <p className="text-sm text-slate-300 mb-3">
              That&apos;s <span className="font-bold text-red-300">${Math.round(data.uhi_premium_annual)}/year</span> you&apos;re paying because your neighborhood runs hotter than it should. Urban heat islands increase cooling demand by an estimated {data.uhi_premium_pct}% in dense areas.
            </p>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${data.uhi_premium_pct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0%</span>
              <span>{data.uhi_premium_pct}% UHI premium</span>
              <span>30%</span>
            </div>
          </div>

          {/* Cooling breakdown */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-400 mb-3">Estimated bill breakdown</p>
            <div className="space-y-2">
              {[
                { label: "Cooling / AC", pct: data.estimated_cooling_pct, color: "bg-orange-500" },
                { label: "Other uses", pct: 100 - data.estimated_cooling_pct, color: "bg-slate-600" },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-slate-300 font-semibold">{pct}% · ${(data.total_cost * pct / 100).toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top actions */}
          <div>
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3">Actions ranked by savings</p>
            <div className="space-y-2">
              {data.top_actions.map((a, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                    a.difficulty === "Easy" ? "bg-emerald-500/20 text-emerald-400" :
                    a.difficulty === "Medium" ? "bg-amber-500/20 text-amber-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>{a.difficulty[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{a.action}</p>
                    <p className="text-xs text-slate-500">One-time cost: ~${a.cost}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-emerald-400">-${a.savings_monthly}/mo</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assistance programs */}
          {data.assistance_programs.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-xs font-black text-blue-300 uppercase tracking-widest mb-2">Assistance Programs</p>
              <div className="flex flex-wrap gap-2">
                {data.assistance_programs.map((p) => (
                  <span key={p} className="text-xs px-2.5 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-full">{p}</span>
                ))}
              </div>
              <a href="https://www.acf.hhs.gov/ocs/programs/liheap" target="_blank" rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                <ExternalLink className="h-3 w-3" /> Apply for energy assistance
              </a>
            </div>
          )}

          {/* Auto-search address */}
          {data.address && (
            <button
              onClick={() => router.push(`/results?address=${encodeURIComponent(data.address!)}`)}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold rounded-xl text-sm transition-all"
            >
              View Heat Profile for {data.address} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
