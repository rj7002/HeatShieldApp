import Link from "next/link";
import { Shield, Receipt, MapPin, ArrowLeft, Info, Brain, TreePine,
  BarChart2, DollarSign, PieChart, CheckSquare, Search,
  Target, Thermometer, Zap, SlidersHorizontal } from "lucide-react";
import BillScannerTool from "@/components/BillScannerTool";
import StreetAuditTool from "@/components/StreetAuditTool";
import HeatStressPredictor from "@/components/HeatStressPredictor";
import ImpactCalculator from "@/components/ImpactCalculator";

export const metadata = {
  title: "AI Tools | HeatShield",
  description: "Scan your utility bill or street photo for AI-powered heat analysis",
};

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-1.5 rounded-lg">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">HeatShield</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-400 font-semibold">AI Tools</span>
          <Link href="/" className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 text-violet-300 px-4 py-1.5 rounded-full text-xs font-semibold mb-5 tracking-widest uppercase">
            Powered by Google Gemini 2.5
          </div>
          <h1 className="text-4xl font-black text-white mb-3">AI Heat Analysis Tools</h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
            Upload a real image. AI extracts structured data and turns it into interactive charts, scores, and personalized recommendations.
          </p>
        </div>

        {/* Privacy note */}
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 max-w-xl mx-auto mb-10 text-xs text-slate-500">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Images are sent directly to Google Gemini and never stored on our servers.
        </div>

        {/* Two tool columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Utility Bill Scanner */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-black text-white">Utility Bill Scanner</h2>
                <p className="text-xs text-slate-500">AI reads your bill and generates a usage chart, UHI cost breakdown, and action plan</p>
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
              <BillScannerTool />
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <p className="text-xs text-amber-300 font-semibold mb-2">What gets extracted and built:</p>
              <ul className="text-xs text-slate-400 space-y-1.5">
                {[
                  { icon: BarChart2,   text: "Usage bar chart comparing your kWh to the national average" },
                  { icon: DollarSign,  text: "UHI premium card showing the extra cost of urban heat" },
                  { icon: PieChart,    text: "Bill breakdown separating cooling from other usage" },
                  { icon: CheckSquare, text: "Action cards ranked by estimated monthly savings" },
                  { icon: Search,      text: "Auto-search your address if found on the bill" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500/60" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Street Heat Audit */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-black text-white">Street Heat Audit</h2>
                <p className="text-xs text-slate-500">AI analyzes your block and generates a heat score, surface breakdown, and recommendations</p>
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
              <StreetAuditTool />
            </div>
            <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
              <p className="text-xs text-violet-300 font-semibold mb-2">What gets extracted and built:</p>
              <ul className="text-xs text-slate-400 space-y-1.5">
                {[
                  { icon: Target,           text: "Heat score ring calibrated to the same scale as main results" },
                  { icon: PieChart,         text: "Surface breakdown showing pavement, trees, rooftops, and green space" },
                  { icon: Thermometer,      text: "Estimated UHI delta in °F specific to this block" },
                  { icon: Zap,              text: "Ranked recommendations with actual temperature reduction per action" },
                  { icon: SlidersHorizontal,text: "Impact calculator pre-filled with AI-extracted values" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-violet-500/60" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Interactive ML Models */}
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-black text-white">Interactive Models</h2>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-slate-500">No image required, runs locally</span>
          </div>
          <p className="text-sm text-slate-500 mb-8">Explore heat science through in-browser models. Adjust sliders and see predictions update in real time.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">Heat Stress Predictor</h3>
                  <p className="text-xs text-slate-500">Neural net trained in-browser on NOAA heat index data</p>
                </div>
              </div>
              <HeatStressPredictor />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <TreePine className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">Community Impact Calculator</h3>
                  <p className="text-xs text-slate-500">Estimate how trees, cool roofs, and green space reduce UHI</p>
                </div>
              </div>
              <ImpactCalculator />
            </div>
          </div>
        </div>

        {/* How to get satellite image */}
        <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto">
          <h3 className="text-sm font-black text-white mb-3">How to get a satellite image of your street</h3>
          <ol className="text-sm text-slate-400 space-y-1.5 list-decimal ml-4">
            <li>Open <span className="text-white">Google Maps</span> and search your address</li>
            <li>Click the <span className="text-white">Satellite</span> layer button</li>
            <li>Zoom until you can see individual rooftops</li>
            <li>Take a screenshot (Cmd+Shift+4 on Mac, Win+Shift+S on Windows)</li>
            <li>Upload above. The AI identifies every heat source it can see.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
