"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import type { HeatProfileResponse } from "@/app/api/heat-profile/route";
import type { GreenHour } from "@/app/api/green-times/route";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Is it safe to go for a run today?",
  "What's the coolest time to go outside?",
  "How do I keep my apartment cool without AC?",
  "Who's most at risk in this heat?",
  "Should I be worried about my pets?",
];

export default function HeatChat({
  profile,
  greenHours,
}: {
  profile: HeatProfileResponse;
  greenHours: GreenHour[];
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const bestHours = greenHours
    .filter((h) => h.tier === "best")
    .slice(0, 3)
    .map((h) => h.label)
    .join(", ");

  const context = {
    city: profile.city,
    state: profile.state,
    urban_temp_f: profile.urban_temp_f,
    rural_temp_f: profile.rural_temp_f,
    uhi_delta_f: profile.uhi_delta_f,
    feels_like_f: profile.feels_like_f,
    humidity: profile.humidity,
    risk_score: profile.risk_score,
    risk_level: profile.risk_level,
    best_hours: bestHours || undefined,
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, context }),
      });
      if (!res.body) { setStreaming(false); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value);
        setMessages([...newMessages, { role: "assistant", content: full }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I couldn't reach the AI. Please try again." }]);
    } finally {
      setStreaming(false);
    }
  }

  const riskColor =
    profile.risk_level === "Extreme" ? "from-red-500 to-rose-600" :
    profile.risk_level === "High" ? "from-orange-500 to-red-500" :
    profile.risk_level === "Moderate" ? "from-amber-500 to-orange-500" :
    "from-emerald-500 to-green-600";

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r ${riskColor} text-white font-bold rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all`}
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-sm">Ask AI</span>
          <MessageCircle className="h-4 w-4" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col w-[360px] max-w-[calc(100vw-24px)]"
          style={{
            height: "min(560px, calc(100vh - 96px))",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          }}
        >
          <div className="flex flex-col h-full bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${riskColor} shrink-0`}>
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-white">HeatShield AI</div>
                <div className="text-xs text-white/70 truncate">
                  {profile.city} · {profile.risk_level} Risk · {profile.urban_temp_f}°F
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="flex gap-2.5">
                    <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${riskColor} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-300 leading-relaxed max-w-[85%]">
                      I have live heat data for <strong className="text-white">{profile.city}</strong>.
                      It&apos;s currently <strong className="text-orange-300">{profile.urban_temp_f}°F</strong>, which is {profile.uhi_delta_f}°F hotter than the surrounding rural area.
                      What would you like to know?
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 pl-9">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="w-full text-left text-xs px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    m.role === "user"
                      ? "bg-white/10"
                      : `bg-gradient-to-br ${riskColor}`
                  }`}>
                    {m.role === "user"
                      ? <User className="h-3.5 w-3.5 text-slate-300" />
                      : <Bot className="h-3.5 w-3.5 text-white" />
                    }
                  </div>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] ${
                    m.role === "user"
                      ? "bg-white/10 text-white rounded-tr-sm"
                      : "bg-white/5 border border-white/10 text-slate-300 rounded-tl-sm"
                  }`}>
                    {m.content || (
                      <span className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); send(input); }}
                className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about heat safety…"
                  disabled={streaming}
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none px-1"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || streaming}
                  className={`p-2 rounded-lg bg-gradient-to-br ${riskColor} disabled:opacity-40 transition-opacity`}
                >
                  <Send className="h-3.5 w-3.5 text-white" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
