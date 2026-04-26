"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import type { HeatProfileResponse } from "@/app/api/heat-profile/route";
import type { AirQualityData } from "@/app/api/air-quality/route";

interface Props {
  profile: HeatProfileResponse;
  aq: AirQualityData;
  forecastHighF?: number;
  forecastLowF?: number;
}

export default function ConditionsBrief({ profile, aq, forecastHighF, forecastLowF }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setText("");
    setLoading(true);

    fetch("/api/conditions-brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city:          profile.city,
        state:         profile.state,
        urban_temp_f:  profile.urban_temp_f,
        feels_like_f:  profile.feels_like_f,
        uhi_delta_f:   profile.uhi_delta_f,
        humidity:      profile.humidity,
        aqi:           aq.aqi,
        aqi_category:  aq.aqi_category,
        pm25:          aq.pm25,
        ozone_ug:      aq.ozone_ug,
        uv_peak:       aq.peak_uv,
        uv_category:   aq.uv_category,
        uv_burn_min:   aq.uv_burn_min,
        forecast_high_f: forecastHighF ?? profile.urban_temp_f,
        forecast_low_f:  forecastLowF  ?? profile.rural_temp_f,
        risk_level:    profile.risk_level,
      }),
    })
      .then(async (res) => {
        if (!res.body) { setLoading(false); return; }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        setLoading(false);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setText((p) => p + decoder.decode(value));
        }
      })
      .catch(() => setLoading(false));
  }, [profile.city, profile.lat]); // re-run only on new location

  if (!loading && !text) return null;

  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-5 py-4 flex gap-3">
      <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">AI Conditions Brief</span>
          <span className="text-[10px] text-slate-600">Google Gemini 2.5</span>
        </div>
        {loading ? (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "120ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "240ms" }} />
          </div>
        ) : (
          <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
        )}
      </div>
    </div>
  );
}
