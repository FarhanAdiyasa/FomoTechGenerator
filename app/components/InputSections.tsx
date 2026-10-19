"use client";

import { useState, useEffect } from "react";
import RoastCard from "./RoastCard";
import { getRoastReportAction } from "@/app/actions";
import { RoastReport } from "@/lib/types";

const SCAN_STEPS = [
  "🔍 Probing public GitHub repositories...",
  "📦 Parsing package.json & lockfile trees...",
  "⚡ Benchmarking dependencies against 2026 standards...",
  "🔥 Cooking savage roast & modernization roadmap...",
];

export default function InputSection() {
  const [githubLink, setGithubLink] = useState("");
  const [report, setReport] = useState<RoastReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [scanStepIndex, setScanStepIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setScanStepIndex(0);
      interval = setInterval(() => {
        setScanStepIndex((prev) => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!githubLink.trim() || loading) return;

    setError("");
    setReport(null);
    setLoading(true);

    try {
      const result = await getRoastReportAction(githubLink);

      if (result.success && result.report) {
        setReport(result.report);
      } else {
        setError(result.error || "An unknown error occurred.");
      }
    } catch (err: any) {
      console.error("Error:", err);
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 relative overflow-hidden font-mono">
      <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
        <h2 className="text-3xl md:text-4xl font-pixel text-primary mb-6 uppercase">
          Audit Your Tech Stack
        </h2>
        <p className="font-mono text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          People may hate FOMO, but this one is necessary. We inspect your real dependency manifests,
          score your tech debt, and roast what you&apos;re missing in 2026.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-8 space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-lg select-none">
              @
            </span>
            <input
              type="text"
              placeholder="GITHUB_USERNAME"
              value={githubLink}
              onChange={(e) => setGithubLink(e.target.value)}
              disabled={loading}
              className={`w-full bg-black text-white font-mono text-lg pl-10 pr-4 py-4 border-2 outline-none transition-colors placeholder:text-gray-600 ${
                error && !githubLink
                  ? "border-destructive animate-shake"
                  : "border-white focus:border-primary"
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !githubLink.trim()}
            className={`pixel-btn text-lg uppercase w-full py-4 transition-all ${
              loading || !githubLink.trim() ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.01]"
            }`}
          >
            {loading ? "RUNNING TECH AUDIT..." : "GENERATE MY FOMO REPORT"}
          </button>
        </form>

        {/* Animated Scanner Progress */}
        {loading && (
          <div className="max-w-xl mx-auto p-5 bg-black border-2 border-primary/50 text-left space-y-2 animate-pulse">
            <div className="flex items-center justify-between text-xs text-primary font-bold uppercase mb-2">
              <span>SCANNING ENGINE IN PROGRESS</span>
              <span>[{scanStepIndex + 1}/{SCAN_STEPS.length}]</span>
            </div>
            <div className="text-sm text-white font-mono flex items-center gap-2">
              <span className="animate-spin text-primary">⚙️</span>
              {SCAN_STEPS[scanStepIndex]}
            </div>
            <div className="w-full bg-white/10 h-1 mt-3">
              <div
                className="bg-primary h-full transition-all duration-500"
                style={{ width: `${((scanStepIndex + 1) / SCAN_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="max-w-xl mx-auto mt-6 p-4 bg-red-950/40 border-2 border-destructive text-red-200 text-center font-mono text-sm">
            ❌ {error}
          </div>
        )}

        {/* Render Structured Roast Card */}
        {report && <RoastCard report={report} />}
      </div>
    </section>
  );
}
