"use client";

import { useState } from "react";
import Results from "./Results";

import { generateRoastAction } from "@/app/actions";

export default function InputSection() {
  const [githubLink, setGithubLink] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async () => {
    setError("");
    setShowResults(false);
    setLoading(true);

    try {
      const result = await generateRoastAction(githubLink);

      if (result.success && result.data) {
        setAnalysisResult(result.data);
        setShowResults(true);
      } else {
        setError(result.error || "An unknown error occurred.");
        alert(result.error || "An error occurred.");
      }
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
        <h2 className="text-3xl md:text-4xl font-pixel text-primary mb-8 uppercase">
          Let’s Get Started
        </h2>
        <p className="font-mono text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          People may hate FOMO, but this one is necessary! Brace yourself,
          we&apos;re about to judge just how FOMO you really are.
        </p>

        {/* Input Fields */}
        <div className="mb-8 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="TYPE YOUR GITHUB USERNAME..."
            value={githubLink}
            onChange={(e) => setGithubLink(e.target.value)}
            className={`w-full bg-black text-white font-mono text-xl p-4 border-2 outline-none transition-colors placeholder:text-gray-600 ${error && !githubLink
              ? "border-destructive animate-shake"
              : "border-white focus:border-primary"
              }`}
          />
        </div>

        {/* Submit Button with Animation */}
        <button
          onClick={handleSubmit}
          className={`pixel-btn text-xl uppercase w-full max-w-xl ${loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          disabled={loading} // Disable button while loading
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> ANALYZING...
            </span>
          ) : (
            "GENERATE MY FOMO REPORT"
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-500 text-red-200 rounded-lg text-center font-mono animate-pulse">
            ❌ {error}
          </div>
        )}

        {/* Render Results */}
        {showResults && analysisResult && <Results results={analysisResult} />}
      </div>
    </section>
  );
}
