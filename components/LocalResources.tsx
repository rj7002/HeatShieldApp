"use client";

import { useState } from "react";
import { Search, ExternalLink, Sparkles, Loader } from "lucide-react";
import type { LocalResourcesData } from "@/app/api/local-resources/route";

interface Props {
  city: string;
  state: string;
}

function renderMarkdown(raw: string | undefined) {
  if (!raw) return null;
  return raw.split("\n").map((line, i) => {
    if (line.startsWith("## ") || line.startsWith("### "))
      return <h4 key={i} className="text-xs font-black text-white mt-3 mb-1 uppercase tracking-wider">{line.replace(/^#+\s/, "")}</h4>;
    if (line.startsWith("- ") || line.startsWith("* ") || line.match(/^\d+\./))
      return (
        <li key={i} className="text-sm text-slate-300 leading-relaxed ml-3 list-disc mb-1">
          {line.replace(/^[-*]\s|^\d+\.\s/, "")}
        </li>
      );
    if (line.startsWith("**") && line.endsWith("**"))
      return <p key={i} className="text-xs font-bold text-white mt-2 mb-0.5">{line.slice(2, -2)}</p>;
    if (line.trim() === "") return <div key={i} className="h-1" />;
    return <p key={i} className="text-sm text-slate-300 leading-relaxed">{line}</p>;
  });
}

export default function LocalResources({ city, state }: Props) {
  const [data, setData] = useState<LocalResourcesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search() {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/local-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, state }),
      });
      const d = await res.json();
      setData({ text: d.text ?? "", sources: d.sources ?? [] });
    } catch {
      setData({ text: "Could not retrieve local resources. Try searching Google for heat assistance programs in your area.", sources: [] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-white/5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-black text-white leading-none mb-0.5">Local Heat Resources</h2>
          <p className="text-xs text-slate-500">
            Gemini searches the web for live assistance programs in {city}{state ? `, ${state}` : ""}
          </p>
        </div>
      </div>

      <div className="p-5">
        {!searched ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-400 mb-4 max-w-sm mx-auto">
              Find current utility assistance programs, emergency hotlines, and heat relief resources specific to {city}.
            </p>
            <button
              onClick={search}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20"
            >
              <Search className="h-4 w-4" />
              Search with Gemini
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center gap-3 py-6 justify-center text-slate-400 text-sm">
            <Loader className="h-4 w-4 animate-spin" />
            Gemini is searching for local programs in {city}...
          </div>
        ) : data ? (
          <div className="space-y-4">
            <ul className="space-y-0.5">
              {renderMarkdown(data.text)}
            </ul>

            {data.sources.length > 0 && (
              <div className="pt-3 border-t border-white/5">
                <div className="text-[10px] text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Search className="h-3 w-3" /> Sources from Google Search
                </div>
                <div className="flex flex-col gap-1.5">
                  {data.sources.map((s, i) => (
                    <a
                      key={i}
                      href={s.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors group"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0 text-blue-500/50 group-hover:text-blue-400" />
                      <span className="truncate">{s.title || s.uri}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={search}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
            >
              <Search className="h-3 w-3" /> Search again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
