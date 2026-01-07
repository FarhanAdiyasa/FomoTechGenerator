"use client";

import { useState } from "react";
import Results from "./Results";

export default function InputSection() {
  const [githubLink, setGithubLink] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const [loading, setLoading] = useState(false); // Track loading state
  const [error, setError] = useState<string>(""); // Track error message

  const handleSubmit = async () => {
    // Reset error message when user tries to submit
    setError("");
    setShowResults(false);
    setLoading(true); // Set loading to true when the button is clicked
    try {
      const response = await fetch("/api/github-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          githubLink,
        }),
      });
      if (!response.ok) {
        throw new Error("Unexpected API response format.");
      }

      const rawData = await response.text();

      setAnalysisResult(rawData); // Set the cleaned and parsed data
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while fetching data.");
    }
    setLoading(false); // Set loading to false after data is fetched
    setShowResults(true);
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

        {/* Render Results */}
        {showResults && analysisResult && <Results results={analysisResult} />}
      </div>
    </section>
  );
}
