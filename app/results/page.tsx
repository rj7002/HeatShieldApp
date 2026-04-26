"use client";

import { useSearchParams } from "next/navigation";
import React, { useEffect, useState, Suspense, lazy } from "react";
import type { HeatProfileResponse } from "@/app/api/heat-profile/route";
import type { CoolingCenter } from "@/lib/overpass";
import type { ForecastDay } from "@/lib/weather";
import {
  Shield, Thermometer, MapPin, Zap,
  ChevronDown, ExternalLink, Clock, AlertTriangle,
  Share2, ClipboardCheck, Activity, BarChart2,
  Phone, Globe, Mail, Accessibility,
  BookOpen, Users, Waves, TreePine, Heart, Film,
  ShoppingBag, Dumbbell, Building2,
} from "lucide-react";
import Link from "next/link";
import TempCompare from "@/components/TempCompare";
import ForecastChart from "@/components/ForecastChart";
import HeatRiskQuiz from "@/components/HeatRiskQuiz";
import HistoricalChart from "@/components/HistoricalChart";
import GreenTimeWidget from "@/components/GreenTimeWidget";
import HeatChat from "@/components/HeatChat";
import AirQualityCard from "@/components/AirQualityCard";
import ConditionsBrief from "@/components/ConditionsBrief";
import LocalResources from "@/components/LocalResources";
import type { HistoricalYear } from "@/app/api/historical/route";
import type { GreenHour } from "@/app/api/green-times/route";
import type { AirQualityData } from "@/app/api/air-quality/route";

const CoolingMap = lazy(() => import("@/components/CoolingMap"));

// ── Helpers ───────────────────────────────────────────────────────────────────
function riskColor(level: string) {
  switch (level) {
    case "Low":      return { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/30", bar: "bg-emerald-400", accent: "#34d399" };
    case "Moderate": return { bg: "bg-amber-500/15",   text: "text-amber-300",   border: "border-amber-500/30",   bar: "bg-amber-400",   accent: "#fbbf24" };
    case "High":     return { bg: "bg-orange-500/15",  text: "text-orange-300",  border: "border-orange-500/30",  bar: "bg-orange-400",  accent: "#f97316" };
    case "Extreme":  return { bg: "bg-red-500/15",     text: "text-red-300",     border: "border-red-500/30",     bar: "bg-red-400",     accent: "#ef4444" };
    default:         return { bg: "bg-slate-500/15",   text: "text-slate-300",   border: "border-slate-500/30",   bar: "bg-slate-400",   accent: "#94a3b8" };
  }
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div>
        <h2 className="text-base font-black text-white leading-none">{title}</h2>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      <div className="flex-1 h-px bg-white/5" />
      {right}
    </div>
  );
}

// ── Action Plan ───────────────────────────────────────────────────────────────
function ActionPlan({ profile }: { profile: HeatProfileResponse }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [housingType, setHousingType] = useState("apartment");
  const [isRenter, setIsRenter] = useState(true);

  async function generate() {
    setStarted(true);
    setLoading(true);
    setText("");
    const res = await fetch("/api/action-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: profile.city, state: profile.state,
        risk_score: profile.risk_score, risk_level: profile.risk_level,
        uhi_delta_f: profile.uhi_delta_f, feels_like_f: profile.feels_like_f,
        housing_type: housingType, is_renter: isRenter,
      }),
    });
    if (!res.body) { setLoading(false); return; }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      setText((p) => p + decoder.decode(value));
    }
    setLoading(false);
  }

  function renderMarkdown(raw: string) {
    return raw.split("\n").map((line, i) => {
      if (line.startsWith("## "))
        return <h3 key={i} className="text-sm font-black text-white mt-5 mb-2 uppercase tracking-wider">{line.slice(3)}</h3>;
      if (line.startsWith("- ") || line.startsWith("* "))
        return (
          <li key={i} className="text-sm text-slate-300 leading-relaxed ml-3 list-disc mb-1.5">
            {line.slice(2)}
          </li>
        );
      if (line.trim() === "") return <div key={i} className="h-1.5" />;
      return <p key={i} className="text-sm text-slate-300 leading-relaxed mb-1">{line}</p>;
    });
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-6 pt-6 pb-5 border-b border-white/5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
          <Zap className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-black text-white">Personalized Action Plan</h2>
          <p className="text-xs text-slate-500">Google Gemini 2.5 · tailored to your housing and risk level</p>
        </div>
      </div>

      <div className="p-6">
        {!started ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Housing type</label>
                <select
                  value={housingType} onChange={(e) => setHousingType(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 appearance-none"
                >
                  <option value="apartment">Apartment</option>
                  <option value="single-family home">Single-family home</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="mobile home">Mobile home</option>
                  <option value="condo">Condo</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">You are a…</label>
                <select
                  value={isRenter ? "renter" : "owner"} onChange={(e) => setIsRenter(e.target.value === "renter")}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 appearance-none"
                >
                  <option value="renter">Renter</option>
                  <option value="owner">Homeowner</option>
                </select>
              </div>
            </div>
            <button
              onClick={generate}
              className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Generate My Action Plan
            </button>
          </div>
        ) : (
          <div className="min-h-[100px]">
            {renderMarkdown(text)}
            {loading && (
              <span className="inline-flex items-center gap-1 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "120ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "240ms" }} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cooling center card ───────────────────────────────────────────────────────
const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Library: BookOpen,
  "Community Center": Users,
  Pool: Waves,
  "Park / Shade": TreePine,
  "Social Services": Heart,
  Cinema: Film,
  "Shopping Mall": ShoppingBag,
  "Recreation Center": Dumbbell,
  "House of Worship": Building2,
};

const WHEELCHAIR_LABEL: Record<string, { label: string; color: string }> = {
  yes:     { label: "Accessible", color: "text-emerald-400" },
  limited: { label: "Limited access", color: "text-amber-400" },
  no:      { label: "Not accessible", color: "text-red-400" },
};

function CoolingCenterCard({ center }: { center: CoolingCenter }) {
  const TypeIcon = TYPE_ICON[center.type] ?? MapPin;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`;
  const osmUrl = `https://www.openstreetmap.org/node/${center.id}`;

  return (
    <div className="group bg-white/5 border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 rounded-xl p-4 transition-all flex flex-col gap-3">
      {/* Top row: icon + name + distance */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <TypeIcon className="h-4 w-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm leading-tight">{center.name}</div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-slate-500">{center.type}</span>
            {center.operator && (
              <span className="text-xs text-slate-600">· {center.operator}</span>
            )}
          </div>
        </div>
        <span className="shrink-0 text-xs font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1">
          {center.distance_km} km
        </span>
      </div>

      {/* Details grid */}
      <div className="space-y-1.5">
        {center.address && (
          <div className="flex items-start gap-1.5 text-xs text-slate-400">
            <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-slate-600" />
            <span>{center.address}{center.postcode ? ` ${center.postcode}` : ""}</span>
          </div>
        )}
        {center.openingHours && (
          <div className="flex items-start gap-1.5 text-xs text-slate-400">
            <Clock className="h-3 w-3 shrink-0 mt-0.5 text-slate-600" />
            <span className="leading-tight">{center.openingHours}</span>
          </div>
        )}
        {center.phone && (
          <div className="flex items-center gap-1.5 text-xs">
            <Phone className="h-3 w-3 shrink-0 text-slate-600" />
            <a href={`tel:${center.phone.replace(/\s/g, "")}`} className="text-blue-400 hover:text-blue-300 transition-colors">
              {center.phone}
            </a>
          </div>
        )}
        {center.email && (
          <div className="flex items-center gap-1.5 text-xs">
            <Mail className="h-3 w-3 shrink-0 text-slate-600" />
            <a href={`mailto:${center.email}`} className="text-blue-400 hover:text-blue-300 transition-colors truncate">
              {center.email}
            </a>
          </div>
        )}
        {center.website && (
          <div className="flex items-center gap-1.5 text-xs">
            <Globe className="h-3 w-3 shrink-0 text-slate-600" />
            <a href={center.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors truncate">
              {center.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
            </a>
          </div>
        )}
        {center.wheelchair && (
          <div className="flex items-center gap-1.5 text-xs">
            <Accessibility className="h-3 w-3 shrink-0 text-slate-600" />
            <span className={WHEELCHAIR_LABEL[center.wheelchair]?.color ?? "text-slate-400"}>
              {WHEELCHAIR_LABEL[center.wheelchair]?.label}
            </span>
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="flex gap-2 pt-1 border-t border-white/5">
        <a
          href={directionsUrl}
          target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 rounded-lg py-1.5 transition-all"
        >
          <MapPin className="h-3 w-3" /> Get Directions
        </a>
        <a
          href={osmUrl}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-all"
        >
          <ExternalLink className="h-3 w-3" /> OSM
        </a>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function ResultsContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get("address") ?? "";

  const [ringMounted, setRingMounted] = useState(false);
  const [profile,     setProfile]     = useState<HeatProfileResponse | null>(null);
  const [cooling,     setCooling]     = useState<CoolingCenter[]>([]);
  const [forecast,    setForecast]    = useState<ForecastDay[]>([]);
  const [historical,  setHistorical]  = useState<HistoricalYear[]>([]);
  const [greenHours,  setGreenHours]  = useState<GreenHour[]>([]);
  const [airQuality,      setAirQuality]      = useState<AirQualityData | null>(null);
  const [loadingAQ,       setLoadingAQ]       = useState(false);
  const [profileError, setProfileError] = useState("");
  const [loadingProfile,  setLoadingProfile]  = useState(true);
  const [loadingCooling,  setLoadingCooling]  = useState(false);
  const [expandRisk,      setExpandRisk]      = useState(false);
  const [showCenterList,  setShowCenterList]  = useState(false);
  const [showQuiz,        setShowQuiz]        = useState(false);
  const [copied,          setCopied]          = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoadingProfile(true);
    fetch(`/api/heat-profile?address=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setProfileError(data.error); return; }
        setProfile(data);
        setShowCenterList(data.risk_level === "High" || data.risk_level === "Extreme");
        setTimeout(() => setRingMounted(true), 120);
        // Persist recent search
        try {
          const entry = { address, city: data.city, risk_level: data.risk_level, risk_score: data.risk_score, urban_temp_f: data.urban_temp_f, ts: Date.now() };
          const stored = JSON.parse(localStorage.getItem("hs_recents") ?? "[]");
          const filtered = stored.filter((r: { city: string }) => r.city !== data.city);
          localStorage.setItem("hs_recents", JSON.stringify([entry, ...filtered].slice(0, 4)));
        } catch { /* ignore */ }

        setLoadingCooling(true);
        return Promise.all([
          fetch(`/api/cooling?lat=${data.lat}&lng=${data.lng}&south=${data.bbox.south}&north=${data.bbox.north}&west=${data.bbox.west}&east=${data.bbox.east}`)
            .then((r) => r.json()).then((d) => setCooling(d.centers ?? []))
            .finally(() => setLoadingCooling(false)),
          fetch(`/api/forecast?lat=${data.lat}&lng=${data.lng}`)
            .then((r) => r.json()).then((d) => setForecast(d.days ?? [])),
          fetch(`/api/historical?lat=${data.lat}&lng=${data.lng}`)
            .then((r) => r.json()).then((d) => setHistorical(d.years ?? [])),
          fetch(`/api/green-times?lat=${data.lat}&lng=${data.lng}`)
            .then((r) => r.json()).then((d) => setGreenHours(d.hours ?? [])),
        ]);
      })
      .catch(() => setProfileError("Failed to load heat profile."))
      .finally(() => setLoadingProfile(false));
  }, [address]);

  useEffect(() => {
    if (!profile) return;
    setLoadingAQ(true);
    fetch(`/api/air-quality?lat=${profile.lat}&lng=${profile.lng}`)
      .then((r) => r.json())
      .then((d) => setAirQuality(d))
      .catch(() => {})
      .finally(() => setLoadingAQ(false));
  }, [profile]);

  function copyShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Thermometer className="h-7 w-7 text-white" />
          </div>
          <p className="text-white font-semibold text-sm mb-1">Analyzing {address}</p>
          <p className="text-slate-600 text-xs">Fetching weather data and running AI analysis…</p>
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 text-orange-400 mx-auto mb-4" />
          <p className="text-white font-bold mb-1">Couldn&apos;t find that location</p>
          <p className="text-slate-400 text-sm mb-6">{profileError || "Try a more specific city name."}</p>
          <Link href="/" className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl text-sm transition-all">
            Try again
          </Link>
        </div>
      </div>
    );
  }

  const rc = riskColor(profile.risk_level);
  const ambientColor = rc.accent;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Ambient risk glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: `radial-gradient(ellipse 80% 35% at 50% -5%, ${ambientColor}15 0%, transparent 65%)` }}
      />

      {showQuiz && <HeatRiskQuiz onClose={() => setShowQuiz(false)} />}

      {/* Emergency banner */}
      {profile.feels_like_f >= 100 && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-red-600 text-white text-center py-2 px-4 text-xs font-bold flex items-center justify-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          HEAT EMERGENCY: Feels like {profile.feels_like_f}°F. Find a cooling center now or call 911.
        </div>
      )}

      {/* Navbar */}
      <nav className={`fixed left-0 right-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md ${profile.feels_like_f >= 100 ? "top-8" : "top-0"}`}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-1.5 rounded-lg">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-base tracking-tight hidden sm:block">HeatShield</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate font-medium text-slate-300">{profile.city}{profile.state ? `, ${profile.state}` : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Link href={`/compare?a=${encodeURIComponent(address)}`}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/25 rounded-lg text-xs font-semibold transition-all">
              <BarChart2 className="h-3 w-3" /> Compare
            </Link>
            <Link href="/tools"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-violet-500/15 border border-violet-500/30 text-violet-300 hover:bg-violet-500/25 rounded-lg text-xs font-semibold transition-all">
              AI Tools
            </Link>
            <button onClick={() => setShowQuiz(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-300 hover:bg-orange-500/25 rounded-lg text-xs font-semibold transition-all">
              <Activity className="h-3 w-3" /><span className="hidden sm:block">Risk quiz</span>
            </button>
            <button onClick={copyShare}
              className="p-1.5 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white rounded-lg transition-all">
              {copied ? <ClipboardCheck className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Section nav */}
      <div className={`fixed left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-sm border-b border-white/5 ${profile.feels_like_f >= 100 ? "top-[104px]" : "top-[57px]"}`}>
        <div className="max-w-5xl mx-auto px-4 py-2 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {[
            { label: "Overview",       href: "#overview" },
            { label: "Air Quality",    href: "#air-quality" },
            { label: "Cooling",        href: "#cooling" },
            { label: "Forecast",       href: "#forecast" },
            { label: "Grid Hours",     href: "#green-time" },
            { label: "Action Plan",    href: "#action-plan" },
            { label: "History",        href: "#history" },
            { label: "Resources",      href: "#resources" },
          ].map(({ label, href }) => (
            <a key={href} href={href}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all whitespace-nowrap">
              {label}
            </a>
          ))}
        </div>
      </div>

      <div className={`relative z-10 max-w-5xl mx-auto px-4 pb-16 ${profile.feels_like_f >= 100 ? "pt-40" : "pt-[96px]"}`}>

        {/* ── Overview ── */}
        <div id="overview" className="scroll-mt-32 mb-6">
          <div className={`rounded-2xl border ${rc.border} ${rc.bg} p-6`}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">

              {/* Score ring */}
              <div className="flex sm:flex-col items-center gap-4 sm:gap-2 shrink-0">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                    <circle cx="50" cy="50" r="42" fill="none"
                      stroke={rc.accent}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="264"
                      strokeDashoffset={ringMounted ? 264 * (1 - profile.risk_score / 10) : 264}
                      style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.34,1.56,0.64,1)" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">{profile.risk_score}</span>
                    <span className="text-[10px] text-slate-500">/10</span>
                  </div>
                </div>
                <span className={`text-xs font-black ${rc.text} sm:text-center`}>{profile.risk_level} Risk</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-black text-white mb-1">
                  {profile.city}{profile.state ? `, ${profile.state}` : ""}
                </h1>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">{profile.ai_summary}</p>

                {/* Stat row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {[
                    { label: "Urban", value: `${profile.urban_temp_f}°F`, color: "text-orange-300" },
                    { label: "Feels like", value: `${profile.feels_like_f}°F`, color: "text-rose-300" },
                    { label: "UHI delta", value: `+${profile.uhi_delta_f}°F`, color: "text-red-300" },
                    { label: "Humidity", value: `${profile.humidity}%`, color: "text-cyan-300" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-black/20 rounded-xl px-3 py-2.5 text-center">
                      <div className={`text-base font-black ${color}`}>{value}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>

                {/* UHI intensity bar */}
                <div className="mb-1 flex justify-between text-xs text-slate-600">
                  <span>UHI intensity</span>
                  <span>{profile.uhi_delta_f}°F above rural</span>
                </div>
                <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                  <div className={`h-full ${rc.bar} rounded-full transition-all duration-1000`}
                    style={{ width: `${Math.min(100, (profile.uhi_delta_f / 15) * 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Expandable risk details */}
            <button onClick={() => setExpandRisk((v) => !v)}
              className="mt-5 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandRisk ? "rotate-180" : ""}`} />
              {expandRisk ? "Hide" : "Show"} risk breakdown
            </button>
            {expandRisk && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                {[
                  { heading: "Risk Factors", items: profile.risk_factors, dot: "text-orange-400" },
                  { heading: "Vulnerable Groups", items: profile.vulnerable_groups, dot: "text-amber-400" },
                  { heading: "Health Risks", items: profile.health_risks, dot: "text-red-400" },
                ].map(({ heading, items, dot }) => (
                  <div key={heading}>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{heading}</h4>
                    <ul className="space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className="text-xs text-slate-500 flex gap-1.5">
                          <span className={`${dot} shrink-0`}>•</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Temp Compare ── */}
        <div className="mb-6">
          <TempCompare
            urbanF={profile.urban_temp_f} ruralF={profile.rural_temp_f}
            deltaF={profile.uhi_delta_f} feelsLikeF={profile.feels_like_f}
            humidity={profile.humidity}
          />
        </div>

        {/* ── AI Conditions Brief (auto-generates when AQ data ready) ── */}
        {airQuality && !loadingAQ && (
          <div className="mb-6">
            <ConditionsBrief
              profile={profile}
              aq={airQuality}
              forecastHighF={forecast[0]?.urban_max_f}
              forecastLowF={forecast[0]?.urban_min_f}
            />
          </div>
        )}

        {/* ── Air Quality + UV ── */}
        <div id="air-quality" className="scroll-mt-32 mb-6">
          <SectionHead
            title="Live Outdoor Conditions"
            sub="Air quality, UV index, and burn time from real sensor data"
          />
          {(loadingAQ || airQuality) && (
            <AirQualityCard
              data={airQuality ?? ({} as AirQualityData)}
              loading={loadingAQ}
            />
          )}
        </div>

        {/* ── Cooling Centers ── */}
        <div id="cooling" className="scroll-mt-32 mb-6">
          <SectionHead
            title="Cooling Centers Near You"
            sub="Free public spaces to cool down, sourced from OpenStreetMap"
            right={
              <a href={`https://www.google.com/maps/search/cooling+center+near+${encodeURIComponent(profile.city + " " + profile.state)}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0 transition-colors">
                <ExternalLink className="h-3 w-3" /> Google Maps
              </a>
            }
          />
          <div className="mb-4">
            <Suspense fallback={
              <div className="w-full h-64 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 text-sm">
                Loading map…
              </div>
            }>
              <CoolingMap lat={profile.lat} lng={profile.lng} city={profile.city} centers={cooling} uhiDelta={profile.uhi_delta_f} tempF={profile.urban_temp_f} />
            </Suspense>
          </div>
          {loadingCooling && (
            <div className="text-xs text-slate-600 text-center py-2">Finding cooling centers...</div>
          )}

          {!loadingCooling && cooling.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
              <p className="text-slate-400 text-sm mb-3">No cooling centers found in OpenStreetMap for this area.</p>
              <a href={`https://www.google.com/maps/search/cooling+center+near+${encodeURIComponent(profile.city)}`}
                target="_blank" rel="noopener noreferrer"
                className="text-blue-400 text-sm hover:text-blue-300 inline-flex items-center gap-1.5 transition-colors">
                <ExternalLink className="h-3.5 w-3.5" /> Search Google Maps instead
              </a>
            </div>
          )}

          {!loadingCooling && cooling.length > 0 && (
            <div>
              {/* Toggle bar */}
              <button
                onClick={() => setShowCenterList((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-xl transition-all mb-3 group"
              >
                <div className="flex items-center gap-2.5 text-sm">
                  <span className="font-semibold text-white">{cooling.length} cooling centers found</span>
                  {!showCenterList && (
                    <span className="text-xs text-slate-500 hidden sm:block">
                      {profile.risk_level === "Low" || profile.risk_level === "Moderate"
                        ? "Conditions are manageable, but they're here if you need them."
                        : "Tap to find relief nearby."}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-white transition-colors shrink-0">
                  {showCenterList ? "Hide list" : "Show list"}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showCenterList ? "rotate-180" : ""}`} />
                </div>
              </button>

              {showCenterList && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cooling.slice(0, 10).map((c) => <CoolingCenterCard key={c.id} center={c} />)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Forecast ── */}
        {forecast.length > 0 && (
          <div id="forecast" className="scroll-mt-32 mb-6">
            <ForecastChart days={forecast} />
          </div>
        )}

        {/* ── Green Time ── */}
        {greenHours.length > 0 && (
          <div id="green-time" className="scroll-mt-32 mb-6">
            <GreenTimeWidget hours={greenHours} />
          </div>
        )}

        {/* ── Action Plan ── */}
        <div id="action-plan" className="scroll-mt-32 mb-6">
          <ActionPlan profile={profile} />
        </div>

        {/* ── Historical Trend ── */}
        {historical.length > 0 && (
          <div id="history" className="scroll-mt-32 mb-6">
            <HistoricalChart years={historical} />
          </div>
        )}

        {/* ── Local Resources (Gemini + Google Search) ── */}
        <div id="resources" className="scroll-mt-32 space-y-4">
          <SectionHead title="Local Resources" sub="AI-searched programs and emergency contacts for your city" />
          <LocalResources city={profile.city} state={profile.state} />
          {/* Static fallback links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: Phone,     label: "Call 211",          desc: "Local cooling assistance hotline",                href: "https://www.211.org",                                        iconColor: "text-red-400",     border: "border-red-500/20 hover:border-red-500/40" },
              { icon: Zap,       label: "LIHEAP",            desc: "Federal utility bill assistance",                 href: "https://www.acf.hhs.gov/ocs/programs/liheap",               iconColor: "text-amber-400",   border: "border-amber-500/20 hover:border-amber-500/40" },
              { icon: Shield,    label: "EPA Heat Islands",  desc: "UHI science, data, and reduction strategies",     href: "https://www.epa.gov/heatislands",                           iconColor: "text-emerald-400", border: "border-emerald-500/20 hover:border-emerald-500/40" },
              { icon: Building2, label: "Weatherization",    desc: "DOE free insulation and cooling upgrades",        href: "https://www.energy.gov/scep/wap/weatherization-assistance-program", iconColor: "text-violet-400",  border: "border-violet-500/20 hover:border-violet-500/40" },
              { icon: TreePine,  label: "Tree Equity Score", desc: "Canopy equity map for your city",                 href: "https://treeequityscore.org",                               iconColor: "text-green-400",   border: "border-green-500/20 hover:border-green-500/40" },
              { icon: MapPin,    label: "Find Shelters",     desc: "Search cooling shelters on Google Maps",          href: `https://www.google.com/maps/search/cooling+center+${encodeURIComponent(profile.city)}`, iconColor: "text-blue-400", border: "border-blue-500/20 hover:border-blue-500/40" },
            ].map(({ icon: Icon, label, desc, href, iconColor, border }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                className={`bg-white/[0.03] border rounded-xl p-4 hover:bg-white/[0.06] transition-all flex items-start gap-3 ${border}`}>
                <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconColor}`} />
                <div>
                  <div className="text-sm font-bold text-white mb-0.5">{label}</div>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>

      <HeatChat profile={profile} greenHours={greenHours} />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
