"use client";

import { useState } from "react";

export default function HeroSection() {
  // Function to handle smooth scroll to input section
  const scrollToInput = () => {
    const inputSection = document.getElementById("input");
    if (inputSection) {
      inputSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative h-screen bg-gradient-to-br from-blue-600 to-purple-700 text-white flex items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
          Is Your <span className="text-yellow-300">Tech Stack</span> Outdated?
        </h1>
        <p className="text-lg md:text-2xl opacity-90 mb-8">
          Let’s see what you’re really “missing out on” with the ultimate Tech
          FOMO test.
        </p>
        <button
          onClick={scrollToInput} // On click, smoothly scroll to the input section
          className="inline-block px-6 py-3 bg-yellow-300 text-blue-800 font-bold rounded hover:bg-yellow-400 transition"
        >
          Generate My FOMO Report
        </button>
      </div>
    </section>
  );
}
