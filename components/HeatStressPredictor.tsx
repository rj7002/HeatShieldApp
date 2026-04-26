"use client";

import { useState, useEffect, useCallback } from "react";
import { Brain, Zap } from "lucide-react";

// ── Neural Network Implementation ────────────────────────────────────────────
// Architecture: 5 inputs → 8 hidden (ReLU) → 1 output (sigmoid)
// Trained in-browser on synthetic data from the NOAA Rothfusz heat index equation

const INPUT_DIM  = 5;
const HIDDEN_DIM = 8;

function relu(x: number) { return Math.max(0, x); }
function sigmoid(x: number) { return 1 / (1 + Math.exp(-Math.max(-60, Math.min(60, x)))); }

// Forward pass — returns hidden layer activations + output
function forward(
  x: number[],
  W1: number[], b1: number[],
  W2: number[], b2: number[]
): { h1: number[]; out: number } {
  const h1 = Array.from({ length: HIDDEN_DIM }, (_, j) =>
    relu(b1[j] + x.reduce((s, xi, i) => s + xi * W1[i * HIDDEN_DIM + j], 0))
  );
  const logit = b2[0] + h1.reduce((s, hi, i) => s + hi * W2[i], 0);
  return { h1, out: sigmoid(logit) };
}

// SGD step — mutates W1/b1/W2/b2 in place
function sgdStep(
  x: number[], target: number, lr: number,
  W1: number[], b1: number[], W2: number[], b2: number[]
) {
  const { h1, out } = forward(x, W1, b1, W2, b2);
  const dOut = out - target; // BCE + sigmoid combined gradient

  for (let i = 0; i < HIDDEN_DIM; i++) W2[i] -= lr * dOut * h1[i];
  b2[0] -= lr * dOut;

  const dh1 = h1.map((hi, i) => dOut * W2[i] * (hi > 0 ? 1 : 0)); // ReLU grad
  for (let i = 0; i < INPUT_DIM; i++)
    for (let j = 0; j < HIDDEN_DIM; j++)
      W1[i * HIDDEN_DIM + j] -= lr * dh1[j] * x[i];
  for (let j = 0; j < HIDDEN_DIM; j++) b1[j] -= lr * dh1[j];
}

// NOAA Rothfusz heat index equation (°F + % RH → apparent temperature °F)
function heatIndex(T: number, R: number): number {
  let hi = -42.379 + 2.04901523*T + 10.14333127*R
    - 0.22475541*T*R - 6.83783e-3*T*T - 5.481717e-2*R*R
    + 1.22874e-3*T*T*R + 8.5282e-4*T*R*R - 1.99e-6*T*T*R*R;
  // Adjustment for low humidity
  if (R < 13 && T >= 80 && T <= 112)
    hi -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  // Adjustment for high humidity at moderate temps
  if (R > 85 && T >= 80 && T <= 87)
    hi += ((R - 85) / 10) * ((87 - T) / 5);
  return hi;
}

// Ground-truth risk function used to generate training labels
function groundTruthRisk(tempF: number, humidity: number, age: number, activity: number, hours: number): number {
  const hi = heatIndex(Math.max(80, tempF), humidity);
  let risk = Math.max(0, (hi - 80) / 55); // 0 at HI=80°F, 1 at HI=135°F
  risk *= 1 + age * 0.4;       // elderly +40% risk
  risk *= 1 + activity * 0.5;  // heavy labor +50% risk
  risk *= 1 + hours * 0.15;    // each hour adds 15%
  return Math.min(1, Math.max(0, risk));
}

// Generate training data from the heat index formula
function generateTrainingData(): { x: number[]; y: number }[] {
  const data: { x: number[]; y: number }[] = [];
  for (const t of [80, 85, 90, 95, 100, 105, 110, 115]) {
    for (const h of [20, 35, 50, 65, 80, 95]) {
      for (const age of [0, 0.5, 1]) {
        for (const act of [0, 0.5, 1]) {
          for (const hrs of [0, 1, 2, 4]) {
            data.push({
              x: [(t - 80) / 35, h / 100, age, act, hrs / 4],
              y: groundTruthRisk(t, h, age, act, hrs),
            });
          }
        }
      }
    }
  }
  return data;
}

// Xavier weight initialization
function initWeights(): { W1: number[]; b1: number[]; W2: number[]; b2: number[] } {
  const s1 = Math.sqrt(2 / INPUT_DIM);
  const s2 = Math.sqrt(2 / HIDDEN_DIM);
  return {
    W1: Array.from({ length: INPUT_DIM * HIDDEN_DIM }, () => (Math.random() * 2 - 1) * s1),
    b1: new Array(HIDDEN_DIM).fill(0),
    W2: Array.from({ length: HIDDEN_DIM }, () => (Math.random() * 2 - 1) * s2),
    b2: [0],
  };
}

// Train the model — returns final weights
function trainModel(): { W1: number[]; b1: number[]; W2: number[]; b2: number[] } {
  const weights = initWeights();
  const { W1, b1, W2, b2 } = weights;
  const data = generateTrainingData();

  for (let epoch = 0; epoch < 400; epoch++) {
    // Fisher-Yates shuffle
    for (let i = data.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [data[i], data[j]] = [data[j], data[i]];
    }
    const lr = epoch < 200 ? 0.02 : 0.005;
    for (const { x, y } of data) sgdStep(x, y, lr, W1, b1, W2, b2);
  }

  return weights;
}

// ── Feature importance via input perturbation ────────────────────────────────
function featureImportance(
  x: number[],
  weights: { W1: number[]; b1: number[]; W2: number[]; b2: number[] }
): number[] {
  const { W1, b1, W2, b2 } = weights;
  const { out: base } = forward(x, W1, b1, W2, b2);
  const delta = 0.1;
  return x.map((xi, i) => {
    const xPlus = [...x]; xPlus[i] = Math.min(1, xi + delta);
    const { out } = forward(xPlus, W1, b1, W2, b2);
    return Math.abs(out - base) / delta;
  });
}

// ── Risk label helpers ────────────────────────────────────────────────────────
function riskLabel(p: number) {
  if (p >= 0.75) return { label: "Extreme Risk", color: "text-red-400", bar: "bg-red-500" };
  if (p >= 0.50) return { label: "High Risk",    color: "text-orange-400", bar: "bg-orange-500" };
  if (p >= 0.25) return { label: "Moderate Risk",color: "text-amber-400",  bar: "bg-amber-500" };
  return                 { label: "Low Risk",     color: "text-emerald-400",bar: "bg-emerald-500" };
}

// ── Component ────────────────────────────────────────────────────────────────
interface Props {
  baseTemp?: number;
  baseHumidity?: number;
}

const AGE_LABELS = ["Child / Youth", "Adult (18–64)", "Elderly (65+)"];
const ACT_LABELS = ["Resting indoors", "Light activity", "Heavy outdoor labor"];

export default function HeatStressPredictor({ baseTemp: initTemp = 90, baseHumidity: initHumidity = 55 }: Props) {
  const [baseTemp,     setBaseTemp]     = useState(initTemp);
  const [baseHumidity, setBaseHumidity] = useState(initHumidity);
  const [weights, setWeights] = useState<{ W1: number[]; b1: number[]; W2: number[]; b2: number[] } | null>(null);
  const [training, setTraining] = useState(true);
  const [ageIdx,   setAgeIdx]   = useState(1);  // adult default
  const [actIdx,   setActIdx]   = useState(0);  // resting default
  const [hours,    setHours]    = useState(1);
  const [risk,     setRisk]     = useState(0);
  const [importance, setImportance] = useState<number[]>([]);

  // Train model once on mount (runs in same JS thread, ~5–15ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const w = trainModel();
      setWeights(w);
      setTraining(false);
    }, 50); // small delay so "Training…" renders first
    return () => clearTimeout(timer);
  }, []);

  const runInference = useCallback(() => {
    if (!weights) return;
    const x = [
      (baseTemp - 80) / 35,
      baseHumidity / 100,
      ageIdx / 2,
      actIdx / 2,
      hours / 4,
    ];
    const { out } = forward(x, weights.W1, weights.b1, weights.W2, weights.b2);
    const imp = featureImportance(x, weights);
    setRisk(out);
    setImportance(imp);
  }, [weights, baseTemp, baseHumidity, ageIdx, actIdx, hours]);

  useEffect(() => { runInference(); }, [runInference]);

  const rl = riskLabel(risk);
  const impLabels = ["Temperature", "Humidity", "Age group", "Activity level", "Exposure time"];
  const maxImp = Math.max(...importance, 0.001);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white">Personal Heat Stress Model</h2>
            <span className="text-xs bg-violet-500/20 border border-violet-500/30 text-violet-300 px-2 py-0.5 rounded-full font-bold">Neural Net</span>
          </div>
          <p className="text-xs text-slate-400">
            5→8→1 neural network trained in your browser on NOAA heat index data
          </p>
        </div>
      </div>

      {training ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-violet-400 animate-pulse" />
          </div>
          <p className="text-sm text-slate-400">Training neural network…</p>
          <p className="text-xs text-slate-600">400 epochs · 1,728 samples · SGD</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-2">
                Air temperature
              </label>
              <div className="flex items-center gap-3">
                <input type="range" min={70} max={120} value={baseTemp}
                  onChange={(e) => setBaseTemp(+e.target.value)}
                  className="flex-1 accent-orange-400" />
                <span className="text-sm font-black text-orange-300 w-12 text-right">{baseTemp}°F</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-2">
                Humidity
              </label>
              <div className="flex items-center gap-3">
                <input type="range" min={10} max={100} value={baseHumidity}
                  onChange={(e) => setBaseHumidity(+e.target.value)}
                  className="flex-1 accent-cyan-400" />
                <span className="text-sm font-black text-cyan-300 w-12 text-right">{baseHumidity}%</span>
              </div>
            </div>

            {/* Age group */}
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-2">
                Age group
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {AGE_LABELS.map((lbl, i) => (
                  <button
                    key={lbl}
                    onClick={() => setAgeIdx(i)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                      ageIdx === i
                        ? "bg-violet-500/30 border-violet-500/50 text-violet-200"
                        : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-2">
                Activity level
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {ACT_LABELS.map((lbl, i) => (
                  <button
                    key={lbl}
                    onClick={() => setActIdx(i)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                      actIdx === i
                        ? "bg-violet-500/30 border-violet-500/50 text-violet-200"
                        : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Exposure time */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-slate-300">Time outdoors</label>
                <span className="text-sm font-black text-violet-400">{hours}h</span>
              </div>
              <input
                type="range" min={0} max={4} step={0.5} value={hours}
                onChange={(e) => setHours(+e.target.value)}
                className="w-full accent-violet-400"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>0h</span><span>1h</span><span>2h</span><span>3h</span><span>4h+</span>
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col gap-4">
            {/* Risk gauge */}
            <div className="bg-black/20 rounded-2xl p-5 text-center">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                Neural Net Output
              </div>
              {/* Arc gauge */}
              <div className="relative w-36 h-20 mx-auto mb-3">
                <svg viewBox="0 0 120 65" className="w-full h-full">
                  {/* Background arc */}
                  <path
                    d="M 10 60 A 50 50 0 0 1 110 60"
                    fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round"
                  />
                  {/* Risk fill arc */}
                  <path
                    d="M 10 60 A 50 50 0 0 1 110 60"
                    fill="none"
                    stroke={risk >= 0.75 ? "#ef4444" : risk >= 0.50 ? "#f97316" : risk >= 0.25 ? "#f59e0b" : "#34d399"}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${risk * 157} 157`}
                    style={{ transition: "stroke-dasharray 0.5s ease, stroke 0.5s ease" }}
                  />
                  {/* Needle */}
                  <line
                    x1="60" y1="60"
                    x2={60 + 38 * Math.cos(Math.PI - risk * Math.PI)}
                    y2={60 - 38 * Math.sin(risk * Math.PI)}
                    stroke="white" strokeWidth="1.5" strokeLinecap="round"
                    style={{ transition: "all 0.5s ease" }}
                  />
                  <circle cx="60" cy="60" r="3" fill="white" />
                </svg>
              </div>

              <div className={`text-3xl font-black ${rl.color} mb-1`}>
                {(risk * 100).toFixed(0)}%
              </div>
              <div className={`text-sm font-bold ${rl.color}`}>{rl.label}</div>

              <div className="mt-3 h-2 bg-black/30 rounded-full overflow-hidden">
                <div
                  className={`h-full ${rl.bar} rounded-full transition-all duration-500`}
                  style={{ width: `${risk * 100}%` }}
                />
              </div>
            </div>

            {/* Feature importance */}
            {importance.length > 0 && (
              <div className="bg-black/20 rounded-2xl p-4">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Feature Importance
                </div>
                <div className="space-y-2">
                  {impLabels.map((lbl, i) => (
                    <div key={lbl} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-28 shrink-0">{lbl}</span>
                      <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full transition-all duration-500"
                          style={{ width: `${((importance[i] ?? 0) / maxImp) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">
                        {((importance[i] ?? 0) / maxImp * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-700 mt-4 text-center">
        Model trained in-browser via SGD · ground truth from NOAA Rothfusz heat index equation · not a medical assessment
      </p>
    </div>
  );
}
