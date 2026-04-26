"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface Props {
  endpoint: string;
  title: string;
  subtitle: string;
  placeholder: string;
  accentColor: string; // tailwind color name e.g. "violet" or "amber"
  tips: string[];
}

function renderMarkdown(raw: string) {
  return raw.split("\n").map((line, i) => {
    if (line.startsWith("## "))
      return <h3 key={i} className="text-base font-black text-white mt-6 mb-2 first:mt-0">{line.slice(3)}</h3>;
    if (line.startsWith("### "))
      return <h4 key={i} className="text-sm font-bold text-slate-200 mt-3 mb-1">{line.slice(4)}</h4>;
    if (line.startsWith("- ") || line.startsWith("* "))
      return <li key={i} className="text-sm text-slate-300 leading-relaxed ml-4 list-disc mb-1">{line.slice(2)}</li>;
    if (line.startsWith("**") && line.endsWith("**"))
      return <p key={i} className="text-sm font-bold text-white mb-1">{line.slice(2, -2)}</p>;
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return <p key={i} className="text-sm text-slate-300 leading-relaxed mb-1">{line}</p>;
  });
}

const ACCENT: Record<string, { border: string; bg: string; text: string; btn: string; ring: string }> = {
  amber: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    btn: "from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/20",
    ring: "ring-amber-500/40",
  },
  violet: {
    border: "border-violet-500/40",
    bg: "bg-violet-500/10",
    text: "text-violet-300",
    btn: "from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 shadow-violet-500/20",
    ring: "ring-violet-500/40",
  },
};

export default function ImageAnalyzer({ endpoint, title, subtitle, placeholder, accentColor, tips }: Props) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ac = ACCENT[accentColor] ?? ACCENT.violet;

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setImage(file);
    setResult("");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  async function analyze() {
    if (!image) return;
    setLoading(true);
    setResult("");

    const form = new FormData();
    form.append("image", image);

    const res = await fetch(endpoint, { method: "POST", body: form });
    if (!res.body) { setLoading(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      setResult((prev) => prev + decoder.decode(value));
    }
    setLoading(false);
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h2 className={`text-xl font-black text-white mb-1`}>{title}</h2>
      <p className="text-sm text-slate-400 mb-5">{subtitle}</p>

      {/* Upload zone */}
      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
            ${dragging ? `${ac.border} ${ac.bg}` : "border-white/10 hover:border-white/20 hover:bg-white/[0.03]"}`}
        >
          <div className={`w-14 h-14 rounded-2xl ${ac.bg} ${ac.border} border flex items-center justify-center`}>
            <ImageIcon className={`h-6 w-6 ${ac.text}`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white mb-1">Drop your image here or click to upload</p>
            <p className="text-xs text-slate-500">{placeholder}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {tips.map((tip) => (
              <span key={tip} className={`text-xs px-2.5 py-1 rounded-full ${ac.bg} ${ac.text} border ${ac.border}`}>{tip}</span>
            ))}
          </div>
          <Upload className="h-4 w-4 text-slate-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Upload preview" className="w-full max-h-64 object-cover rounded-2xl" />
            <button
              onClick={() => { setPreview(null); setImage(null); setResult(""); }}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Analyze button */}
          {!result && (
            <button
              onClick={analyze}
              disabled={loading}
              className={`w-full py-3 bg-gradient-to-r ${ac.btn} disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2`}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing with AI…</>
              ) : (
                "Analyze Image →"
              )}
            </button>
          )}

          {/* Result */}
          {(result || loading) && (
            <div className={`bg-black/20 border ${ac.border} rounded-2xl p-5 min-h-[120px]`}>
              {renderMarkdown(result)}
              {loading && (
                <span className={`inline-block w-2 h-4 ${accentColor === "amber" ? "bg-amber-400" : "bg-violet-400"} animate-pulse rounded ml-0.5`} />
              )}
              {result && !loading && (
                <button
                  onClick={() => { setPreview(null); setImage(null); setResult(""); }}
                  className="mt-4 text-xs text-slate-500 hover:text-white transition-colors"
                >
                  ← Analyze another image
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />
    </div>
  );
}
