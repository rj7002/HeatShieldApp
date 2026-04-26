"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, Thermometer, MapPin, ArrowLeft, ArrowRight,
  AlertTriangle, Search,
} from "lucide-react";
import type { HeatProfileResponse } from "@/app/api/heat-profile/route";

function riskColor(level: string) {
  switch (level) {
    case "Low":      return { text: "text-emerald-300", bg: "bg-emerald-500/20", border: "border-emerald-500/40", bar: "bg-emerald-400", ring: "#34d399" };
    case "Moderate": return { text: "text-amber-300",   bg: "bg-amber-500/20",   border: "border-amber-500/40",   bar: "bg-amber-400",   ring: "#fbbf24" };
    case "High":     return { text: "text-orange-300",  bg: "bg-orange-500/20",  border: "border-orange-500/40",  bar: "bg-orange-400",  ring: "#f97316" };
    case "Extreme":  return { text: "text-red-300",     bg: "bg-red-500/20",     border: "border-red-500/40",     bar: "bg-red-400",     ring: "#f87171" };
    default:         return { text: "text-slate-300",   bg: "bg-slate-500/20",   border: "border-slate-500/40",   bar: "bg-slate-400",   ring: "#94a3b8" };
  }
}

function ScoreRing({ score, level }: { score: number; level: string }) {
  const rc = riskColor(level);
  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle
          cx="50" cy="50" r="42" fill="none"
          stroke={rc.ring}
          strokeWidth="10"
          strokeDasharray={`${(score / 10) * 264} 264`}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white">{score}</span>
        <span className="text-xs text-slate-400">/10</span>
      </div>
    </div>
  );
}

function ProfileCard({ profile, label }: { profile: HeatProfileResponse; label: string }) {
  const rc = riskColor(profile.risk_level);
  return (
    <div className={`rounded-2xl border ${rc.border} ${rc.bg} p-6 flex flex-col gap-4`}>
      <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</div>
      <div className="flex items-center gap-4">
        <ScoreRing score={profile.risk_score} level={profile.risk_level} />
        <div>
          <h2 className="text-xl font-black text-white leading-tight">
            {profile.city}{profile.state ? `, ${profile.state}` : ""}
          </h2>
          <div className={`text-sm font-bold ${rc.text} mt-1`}>{profile.risk_level} Risk</div>
          <Link
            href={`/results?address=${encodeURIComponent(profile.city + (profile.state ? `, ${profile.state}` : ""))}`}
            className="text-xs text-slate-400 hover:text-white mt-2 flex items-center gap-1 transition-colors"
          >
            Full report <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { label: "Urban temp", value: `${profile.urban_temp_f}°F`, color: "text-orange-300" },
          { label: "Rural ref temp", value: `${profile.rural_temp_f}°F`, color: "text-blue-300" },
          { label: "UHI delta", value: `+${profile.uhi_delta_f}°F`, color: "text-red-300" },
          { label: "Feels like", value: `${profile.feels_like_f}°F`, color: "text-rose-300" },
          { label: "Humidity", value: `${profile.humidity}%`, color: "text-cyan-300" },
          { label: "Heat score", value: `${profile.risk_score}/10`, color: rc.text },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex justify-between items-center text-sm">
            <span className="text-slate-400">{label}</span>
            <span className={`font-black ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* UHI bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>UHI intensity</span>
          <span>{profile.uhi_delta_f}°F above rural</span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
          <div
            className={`h-full ${rc.bar} rounded-full transition-all duration-1000`}
            style={{ width: `${Math.min(100, (profile.uhi_delta_f / 15) * 100)}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">{profile.ai_summary}</p>

      {/* Factors */}
      <div>
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Top Risk Factors</div>
        <ul className="space-y-1">
          {profile.risk_factors.slice(0, 4).map((f, i) => (
            <li key={i} className="text-xs text-slate-400 flex gap-1.5">
              <span className="text-orange-400 shrink-0">•</span>{f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DeltaBadge({ a, b }: { a: HeatProfileResponse; b: HeatProfileResponse }) {
  const uhiDiff = parseFloat((a.uhi_delta_f - b.uhi_delta_f).toFixed(1));
  const tempDiff = parseFloat((a.urban_temp_f - b.urban_temp_f).toFixed(1));
  const scoreDiff = a.risk_score - b.risk_score;
  const hotter = a.city;
  const cooler = b.city;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
      <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Head-to-Head</div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-black/20 rounded-xl p-4">
          <div className={`text-2xl font-black ${Math.abs(tempDiff) >= 5 ? "text-red-400" : Math.abs(tempDiff) >= 2 ? "text-orange-400" : "text-slate-300"}`}>
            {tempDiff > 0 ? "+" : ""}{tempDiff}°F
          </div>
          <div className="text-xs text-slate-500 mt-1">Temp difference</div>
        </div>
        <div className="bg-black/20 rounded-xl p-4">
          <div className={`text-2xl font-black ${Math.abs(uhiDiff) >= 4 ? "text-red-400" : Math.abs(uhiDiff) >= 2 ? "text-orange-400" : "text-slate-300"}`}>
            {uhiDiff > 0 ? "+" : ""}{uhiDiff}°F
          </div>
          <div className="text-xs text-slate-500 mt-1">UHI delta gap</div>
        </div>
        <div className="bg-black/20 rounded-xl p-4">
          <div className={`text-2xl font-black ${Math.abs(scoreDiff) >= 3 ? "text-red-400" : Math.abs(scoreDiff) >= 1 ? "text-orange-400" : "text-slate-300"}`}>
            {scoreDiff > 0 ? "+" : ""}{scoreDiff}
          </div>
          <div className="text-xs text-slate-500 mt-1">Risk score gap</div>
        </div>
      </div>

      {Math.abs(tempDiff) > 0.5 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="text-lg font-black text-red-300 mb-1">
            {tempDiff > 0 ? hotter : cooler} is {Math.abs(tempDiff)}°F hotter
          </div>
          <div className="text-xs text-slate-400">
            This represents a meaningful heat equity gap. Residents in hotter areas face higher
            cooling costs, health risks, and climate vulnerability.
          </div>
        </div>
      )}

      {Math.abs(uhiDiff) > 0.5 && (
        <div className="mt-3 bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
          <div className="text-sm font-bold text-orange-300">
            {uhiDiff > 0 ? hotter : cooler} has {Math.abs(uhiDiff)}°F stronger urban heat island effect
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Driven by differences in tree canopy, impervious surfaces, and building density.
          </div>
        </div>
      )}
    </div>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [inputA, setInputA] = useState(searchParams.get("a") ?? "");
  const [inputB, setInputB] = useState(searchParams.get("b") ?? "");
  const [profileA, setProfileA] = useState<HeatProfileResponse | null>(null);
  const [profileB, setProfileB] = useState<HeatProfileResponse | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA, setErrorA] = useState("");
  const [errorB, setErrorB] = useState("");

  async function fetchProfile(
    address: string,
    setProfile: (p: HeatProfileResponse) => void,
    setLoading: (v: boolean) => void,
    setError: (v: string) => void
  ) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/heat-profile?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setProfile(data);
    } catch {
      setError("Failed to load heat profile.");
    } finally {
      setLoading(false);
    }
  }

  function handleCompare(e: React.FormEvent) {
    e.preventDefault();
    if (!inputA.trim() || !inputB.trim()) return;
    router.replace(`/compare?a=${encodeURIComponent(inputA)}&b=${encodeURIComponent(inputB)}`);
    fetchProfile(inputA, setProfileA, setLoadingA, setErrorA);
    fetchProfile(inputB, setProfileB, setLoadingB, setErrorB);
  }

  // Auto-fetch if URL already has both params
  useEffect(() => {
    const a = searchParams.get("a");
    const b = searchParams.get("b");
    if (a) {
      setInputA(a);
      fetchProfile(a, setProfileA, setLoadingA, setErrorA);
    }
    if (b) {
      setInputB(b);
      fetchProfile(b, setProfileB, setLoadingB, setErrorB);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bothLoaded = profileA && profileB;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-1.5 rounded-lg">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">HeatShield</span>
          </Link>
          <ArrowLeft className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-300">Neighborhood Heat Comparison</span>
          <Link
            href="/tools"
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 border border-violet-500/40 text-violet-300 hover:bg-violet-500/30 rounded-lg text-xs font-semibold transition-all"
          >
            AI Tools
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white mb-2">
            Heat Equity Comparison
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Compare urban heat conditions between two neighborhoods or cities.
            Expose the heat gap that climate inequity creates.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleCompare} className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs flex items-center justify-center font-black">A</span>
                First location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={inputA}
                  onChange={(e) => setInputA(e.target.value)}
                  placeholder="e.g. South Phoenix, AZ"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs flex items-center justify-center font-black">B</span>
                Second location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={inputB}
                  onChange={(e) => setInputB(e.target.value)}
                  placeholder="e.g. Scottsdale, AZ"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={!inputA.trim() || !inputB.trim()}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 disabled:opacity-40 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
          >
            <Search className="h-4 w-4" />
            Compare Heat Conditions
          </button>

          {/* Example pairs */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <span className="text-xs text-slate-500">Try:</span>
            {[
              ["South Phoenix, AZ", "Scottsdale, AZ"],
              ["Compton, CA", "Beverly Hills, CA"],
              ["East Baltimore, MD", "Towson, MD"],
              ["Bronx, NY", "Central Park, NY"],
            ].map(([a, b]) => (
              <button
                key={a}
                type="button"
                onClick={() => { setInputA(a); setInputB(b); }}
                className="text-xs px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-slate-400 hover:text-white transition-all"
              >
                {a} vs {b}
              </button>
            ))}
          </div>
        </form>

        {/* Loading states */}
        {(loadingA || loadingB) && (
          <div className="flex items-center justify-center gap-4 py-12">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center animate-pulse">
                <Thermometer className="h-4 w-4 text-white" />
              </div>
              Analyzing heat conditions…
            </div>
          </div>
        )}

        {/* Errors */}
        {(errorA || errorB) && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
            <div className="text-sm text-red-300">
              {errorA && <div>Location A: {errorA}</div>}
              {errorB && <div>Location B: {errorB}</div>}
            </div>
          </div>
        )}

        {/* Results */}
        {bothLoaded && (
          <>
            {/* Delta callout */}
            <div className="mb-6">
              <DeltaBadge a={profileA} b={profileB} />
            </div>

            {/* Side-by-side profiles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ProfileCard profile={profileA} label="Location A" />
              <ProfileCard profile={profileB} label="Location B" />
            </div>

            {/* Grouped stat bars */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-black text-white mb-5">Visual Comparison</h3>
              <div className="space-y-5">
                {[
                  { label: "Urban Temperature", a: profileA.urban_temp_f, b: profileB.urban_temp_f, max: Math.max(profileA.urban_temp_f, profileB.urban_temp_f) + 5, unit: "°F", colorA: "bg-orange-500", colorB: "bg-orange-300" },
                  { label: "UHI Delta", a: profileA.uhi_delta_f, b: profileB.uhi_delta_f, max: Math.max(profileA.uhi_delta_f, profileB.uhi_delta_f) + 2, unit: "°F", colorA: "bg-red-500", colorB: "bg-red-300" },
                  { label: "Feels Like", a: profileA.feels_like_f, b: profileB.feels_like_f, max: Math.max(profileA.feels_like_f, profileB.feels_like_f) + 5, unit: "°F", colorA: "bg-rose-500", colorB: "bg-rose-300" },
                  { label: "Heat Risk Score", a: profileA.risk_score, b: profileB.risk_score, max: 10, unit: "/10", colorA: "bg-amber-500", colorB: "bg-amber-300" },
                  { label: "Humidity", a: profileA.humidity, b: profileB.humidity, max: 100, unit: "%", colorA: "bg-cyan-500", colorB: "bg-cyan-300" },
                ].map(({ label, a, b, max, unit, colorA, colorB }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span className="font-semibold">{label}</span>
                      <span className="flex gap-4">
                        <span className="text-orange-300 font-bold">A: {a}{unit}</span>
                        <span className="text-blue-300 font-bold">B: {b}{unit}</span>
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-4">A</span>
                        <div className="flex-1 h-3 bg-black/30 rounded-full overflow-hidden">
                          <div className={`h-full ${colorA} rounded-full transition-all duration-700`} style={{ width: `${(a / max) * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-orange-300 w-14 text-right">{a}{unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-4">B</span>
                        <div className="flex-1 h-3 bg-black/30 rounded-full overflow-hidden">
                          <div className={`h-full ${colorB} rounded-full transition-all duration-700`} style={{ width: `${(b / max) * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-blue-300 w-14 text-right">{b}{unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading…</div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
