"use client";

import { useState } from "react";
import { X, AlertTriangle, CheckCircle, Shield } from "lucide-react";

const QUESTIONS = [
  {
    id: "age",
    q: "How old are you?",
    options: [
      { label: "Under 18", score: 1 },
      { label: "18–64", score: 0 },
      { label: "65+", score: 2 },
    ],
  },
  {
    id: "ac",
    q: "Do you have working air conditioning at home?",
    options: [
      { label: "Yes, with AC", score: 0 },
      { label: "Fans only", score: 1 },
      { label: "No AC or fans", score: 3 },
    ],
  },
  {
    id: "health",
    q: "Do you have any of these conditions?",
    options: [
      { label: "None", score: 0 },
      { label: "Heart disease, diabetes, or lung condition", score: 2 },
      { label: "Multiple chronic conditions", score: 3 },
    ],
  },
  {
    id: "outdoor",
    q: "How much time do you spend outdoors daily?",
    options: [
      { label: "Mostly indoors", score: 0 },
      { label: "1–3 hours", score: 1 },
      { label: "More than 3 hours / outdoor work", score: 2 },
    ],
  },
];

function getResult(total: number) {
  if (total <= 1) return { level: "Low Risk", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle, msg: "You have low personal heat risk, but stay hydrated and check on vulnerable neighbors." };
  if (total <= 3) return { level: "Moderate Risk", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: Shield, msg: "Take heat precautions seriously. Limit outdoor activity during peak hours (11am–4pm) and drink water regularly." };
  if (total <= 6) return { level: "High Risk", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", icon: AlertTriangle, msg: "You are personally vulnerable to heat. Find a cooling center if your home is too hot. Call 211 for local assistance." };
  return { level: "Extreme Risk", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: AlertTriangle, msg: "Serious danger. Do not stay in an overheated space. Get to a cooling center immediately or call 911 if you feel unwell." };
}

interface Props {
  onClose: () => void;
}

export default function HeatRiskQuiz({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<number[]>([]);

  function answer(score: number) {
    const next = [...scores, score];
    setScores(next);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setStep(QUESTIONS.length); // done
    }
  }

  const total = scores.reduce((a, b) => a + b, 0);
  const result = getResult(total);
  const isDone = step === QUESTIONS.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-white">
            {isDone ? "Your Heat Risk" : `Question ${step + 1} of ${QUESTIONS.length}`}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isDone && (
          <>
            {/* Progress bar */}
            <div className="h-1.5 bg-white/10 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                style={{ width: `${((step) / QUESTIONS.length) * 100}%` }}
              />
            </div>

            <p className="text-white font-semibold mb-4">{QUESTIONS[step].q}</p>
            <div className="space-y-2">
              {QUESTIONS[step].options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => answer(opt.score)}
                  className="w-full text-left px-4 py-3 bg-white/5 border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/10 rounded-xl text-sm text-slate-300 hover:text-white transition-all"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}

        {isDone && (
          <div className={`border rounded-2xl p-5 ${result.bg}`}>
            <div className="flex items-center gap-3 mb-3">
              <result.icon className={`h-6 w-6 ${result.color}`} />
              <span className={`text-xl font-black ${result.color}`}>{result.level}</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">{result.msg}</p>
            <div className="flex gap-2">
              <a
                href="https://www.211.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold rounded-xl text-center transition-all"
              >
                Call 211
              </a>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
