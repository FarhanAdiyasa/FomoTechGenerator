"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Results from "./Results";
interface AnalysisResult {
  totalFomoScore: number;
  roast: string;
  skillsToLearn: string;
  summary: string;
}

export default function InputSection() {
  const [githubLink, setGithubLink] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [loading, setLoading] = useState(false); // Track loading state
  const [error, setError] = useState<string>(""); // Track error message

  const handleSubmit = async () => {
    // Reset error message when user tries to submit
    setError("");
    setShowResults(false);
    setLoading(true); // Set loading to true when the button is clicked
    try {
      const response = await fetch(
        "https://fomo-tech-generator-gbzs.vercel.app/api/github-read",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            githubLink,
          }),
        }
      );

      const rawData = await response.text(); // Fetch response as text
      const cleanedData = rawData
        .replace(/^```json\n/, "") // Remove the opening code block
        .replace(/```$/, ""); // Remove the closing code block

      const parsedData = JSON.parse(cleanedData); // Parse the cleaned JSON string

      // Validate the structure
      if (
        typeof parsedData.totalFomoScore !== "number" ||
        typeof parsedData.roast !== "string" ||
        typeof parsedData.skillsToLearn !== "string" ||
        typeof parsedData.summary !== "string"
      ) {
        throw new Error("Unexpected API response format.");
      }

      setAnalysisResult(parsedData); // Set the cleaned and parsed data
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while fetching data.");
    }
    setLoading(false); // Set loading to false after data is fetched
    setShowResults(true);
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h2 className="text-4xl font-bold text-blue-600 mb-8">
          Let’s Get Started
        </h2>
        <p className="text-gray-600 mb-8">
          People may hate FOMO, but this one is necessary! Brace yourself,
          we&apos;re about to judge just how FOMO you really are.
        </p>

        {/* Input Fields */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Type your github username"
            value={githubLink}
            onChange={(e) => setGithubLink(e.target.value)}
            className={`w-full px-4 py-2 border rounded focus:ring focus:ring-blue-300 ${
              error && !githubLink ? "border-red-500" : ""
            }`}
          />
        </div>

        {/* Submit Button with Animation */}
        <Button
          onClick={handleSubmit}
          className={`mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded transition duration-300 ${
            loading ? "bg-gray-400 cursor-not-allowed" : ""
          }`}
          disabled={loading} // Disable button while loading
        >
          {loading ? (
            <>
              <span className="animate-spin mr-2">🔄</span>Analyzing...
            </>
          ) : (
            "Generate My FOMO Report"
          )}
        </Button>

        {/* Render Results */}
        {showResults && analysisResult && <Results results={analysisResult} />}
      </div>
    </section>
  );
}
