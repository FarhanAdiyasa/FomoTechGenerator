"use client";

import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  // Function to handle smooth scroll to input section
  const scrollToInput = () => {
    const inputSection = document.getElementById("input");
    if (inputSection) {
      inputSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="text-center px-6 relative z-10 max-w-4xl mx-auto">
        <img
          src="/logo.svg"
          alt="Tech FOMO Icon"
          className="w-20 h-20 md:w-32 md:h-32 mx-auto mb-8 animate-pulse drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
        />
        <div className="pixel-box bg-black text-white border-white p-8 md:p-12 mb-12 relative group">
          <h1 className="font-pixel text-3xl md:text-5xl lg:text-6xl leading-tight mb-6">
            IS YOUR <br />
            <span className="text-secondary glitch-text" data-text="TECH STACK">
              TECH STACK
            </span>{" "}
            <br />
            OUTDATED?
          </h1>
          <p className="font-mono text-lg md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Let’s see what you’re really “missing out on” with the ultimate Tech
            FOMO test.
          </p>

          {/* Decorative elements */}
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary" />
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-primary" />
        </div>

        <button
          onClick={scrollToInput}
          className="pixel-btn text-lg md:text-xl flex items-center gap-2 mx-auto group"
        >
          GENERATE MY FOMO REPORT
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  );
}
