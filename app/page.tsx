"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Thermometer, MapPin, Shield, Zap, Users, TreePine, Navigation, Clock, ChevronRight, BarChart2 } from "lucide-react";
import Link from "next/link";

const EXAMPLE_ADDRESSES = [
  "Phoenix, AZ",
  "Houston, TX",
  "Chicago, IL",
  "Baltimore, MD",
  "Los Angeles, CA",
];

const RISK_COLORS: Record<string, string> = {
  Low:      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Moderate: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  High:     "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Extreme:  "bg-red-500/20 text-red-300 border-red-500/30",
};

interface RecentEntry {
  address: string;
  city: string;
  risk_level: string;
  risk_score: number;
  urban_temp_f: number;
  ts: number;
}

export default function Home() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [recents, setRecents] = useState<RecentEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("hs_recents");
      if (stored) setRecents(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    router.push(`/results?address=${encodeURIComponent(address.trim())}`);
  }

  async function handleGeolocate() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
          const data = await res.json();
          if (data.label) {
            router.push(`/results?address=${encodeURIComponent(data.label)}`);
          } else {
            router.push(`/results?address=${lat},${lng}`);
          }
        } catch {
          setGeoError("Couldn't detect your location. Try entering it manually.");
          setGeoLoading(false);
        }
      },
      () => {
        setGeoError("Location access denied. Please enter your address manually.");
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-1.5 rounded-lg shadow-lg shadow-orange-500/30">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">HeatShield</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/compare"
              className="text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all hidden sm:flex items-center gap-1.5"
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Compare
            </Link>
            <Link
              href="/tools"
              className="text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all hidden sm:flex items-center gap-1.5"
            >
              <span>AI Tools</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative pt-16 overflow-hidden">
        {/* Animated heat glow orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "6s" }} />
        <div className="absolute top-60 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "8s" }} />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Heat shimmer lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent"
              style={{
                top: `${15 + i * 11}%`,
                animation: `shimmer ${3 + i * 0.4}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-4xl mx-auto px-4 pt-24 pb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-300 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 tracking-widest uppercase">
            <Thermometer className="h-3.5 w-3.5" />
            Climate Equity Tool · Live Data
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-5 tracking-tight leading-[1.04]">
            Your neighborhood is{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-rose-400 animate-pulse" style={{ animationDuration: "3s" }}>
              hotter than you think.
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Urban heat islands make city neighborhoods up to 20°F hotter than surrounding areas,
            and low-income residents pay the price. Enter your address to see your heat risk,
            find cooling near you, and get a personalized action plan.
          </p>

          {/* Search form */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-3">
            <div className="relative flex items-center">
              <MapPin className="absolute left-4 h-5 w-5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address or city"
                className="w-full pl-12 pr-36 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 text-sm transition-all"
              />
              <button
                type="submit"
                disabled={loading || !address.trim()}
                className="absolute right-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30"
              >
                {loading ? "Loading…" : "Analyze →"}
              </button>
            </div>
          </form>

          {/* Use My Location */}
          <div className="flex flex-col items-center gap-2 mb-6">
            <button
              onClick={handleGeolocate}
              disabled={geoLoading}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              <Navigation className={`h-4 w-4 ${geoLoading ? "animate-spin text-orange-400" : ""}`} />
              {geoLoading ? "Detecting location…" : "Use my current location"}
            </button>
            {geoError && (
              <p className="text-xs text-red-400">{geoError}</p>
            )}
          </div>

          {/* Example chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {EXAMPLE_ADDRESSES.map((ex) => (
              <button
                key={ex}
                onClick={() => setAddress(ex)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Recent searches */}
          {recents.length > 0 && (
            <div className="max-w-xl mx-auto mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Recent</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {recents.slice(0, 4).map((r) => (
                  <button
                    key={r.ts}
                    onClick={() => router.push(`/results?address=${encodeURIComponent(r.address)}`)}
                    className="bg-white/5 border border-white/10 hover:border-white/20 rounded-xl p-3 text-left transition-all group"
                  >
                    <div className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border mb-2 ${RISK_COLORS[r.risk_level] ?? RISK_COLORS.Moderate}`}>
                      {r.risk_level}
                    </div>
                    <div className="text-xs font-bold text-white truncate">{r.city}</div>
                    <div className="text-xs text-slate-500">{r.urban_temp_f}°F</div>
                    <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-slate-400 mt-1 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Thermometer,
              gradient: "from-orange-500 to-red-500",
              glow: "shadow-orange-500/20",
              title: "Heat Risk Score",
              desc: "Real temperature data showing how much hotter your neighborhood runs vs. surrounding rural areas.",
            },
            {
              icon: MapPin,
              gradient: "from-blue-500 to-cyan-500",
              glow: "shadow-blue-500/20",
              title: "Cooling Centers",
              desc: "Nearest libraries, pools, parks, and community centers, all open to the public.",
            },
            {
              icon: Zap,
              gradient: "from-violet-500 to-purple-500",
              glow: "shadow-violet-500/20",
              title: "AI Action Plan",
              desc: "Personalized steps ranked by impact and cost, from quick fixes to long-term improvements.",
            },
            {
              icon: TreePine,
              gradient: "from-emerald-500 to-green-500",
              glow: "shadow-emerald-500/20",
              title: "Community Impact",
              desc: "See how local interventions like trees, cool roofs, and green space can lower temps for everyone.",
            },
          ].map(({ icon: Icon, gradient, glow, title, desc }) => (
            <div
              key={title}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/[0.07] transition-all group"
            >
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg ${glow} group-hover:scale-110 transition-transform`}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-white mb-1.5">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { stat: "20°F", label: "Max UHI temperature difference in US cities" },
            { stat: "1 in 3", label: "Americans live in urban heat islands" },
            { stat: "~12,000", label: "Heat-related deaths in the US annually" },
          ].map(({ stat, label }) => (
            <div key={label}>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 mb-1">
                {stat}
              </div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Who it's for */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-white mb-2">Who HeatShield is built for</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Urban heat is not just weather. It is a public health crisis that hits hardest where resources are thinnest.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              title: "Residents & Renters",
              desc: "Know your risk, find relief, and access assistance programs, even without AC or the ability to modify your building.",
            },
            {
              icon: Shield,
              title: "Community Organizers",
              desc: "Arm your neighbors with data on local heat conditions and city-level grades to push for action.",
            },
            {
              icon: TreePine,
              title: "Local Advocates",
              desc: "Quantify the impact of tree planting, cool roof programs, and green infrastructure for your neighborhood.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div className="shrink-0 mt-0.5">
                <Icon className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between text-sm text-slate-600 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="font-bold text-slate-500">HeatShield</span>
          </div>
          <span>Live weather via Open-Meteo · Maps via OpenStreetMap · AI by Google Gemini</span>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0; transform: translateY(0px); }
          50% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}
