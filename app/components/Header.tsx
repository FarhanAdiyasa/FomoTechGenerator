"use client";

import { useState, useEffect } from "react";
import { getQuotaStatus } from "../actions";

export default function Header() {
  const [isHeroSectionVisible, setIsHeroSectionVisible] = useState(true);
  const [quota, setQuota] = useState<{ percentage: number; count: number; limit: number } | null>(null);

  // Function to handle smooth scroll
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    // Initial fetch
    getQuotaStatus().then(setQuota);

    // Refresh quota every 30 seconds
    const interval = setInterval(() => {
      getQuotaStatus().then(setQuota);
    }, 30000);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === "hero") {
            setIsHeroSectionVisible(entry.isIntersecting);
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    const heroSection = document.getElementById("hero");
    if (heroSection) {
      observer.observe(heroSection);
    }

    return () => {
      clearInterval(interval);
      if (heroSection) {
        observer.unobserve(heroSection);
      }
    };
  }, []);

  const isCritical = quota ? quota.percentage > 80 : false;

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b-2 ${isHeroSectionVisible
        ? "bg-background/90 backdrop-blur-sm border-white/10"
        : "bg-black border-white"
        }`}
    >
      <div className="container mx-auto flex justify-between items-center px-4 py-4">
        {/* Branding */}
        <div
          onClick={() => scrollToSection("hero")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img
            src="/logo.svg"
            alt="Tech FOMO Logo"
            className="w-8 h-8 md:w-10 md:h-10 group-hover:scale-110 transition-transform"
          />
          <div className="text-xl md:text-2xl font-pixel text-primary tracking-tighter uppercase">
            TECH <span className="text-secondary group-hover:animate-pulse">FOMO</span>
          </div>
        </div>

        {/* Navigation & Quota */}
        <div className="flex items-center gap-6">
          {quota && (
            <div className="hidden lg:flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                  {isCritical ? "Quota Critical" : "API Power"}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`} />
              </div>
              <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : 'bg-primary'}`}
                  style={{ width: `${quota.percentage}%` }}
                />
              </div>
            </div>
          )}

          <nav className="flex gap-4">
            <button
              onClick={() => scrollToSection("features")}
              className="hidden md:block font-mono text-sm text-white/70 hover:text-primary transition-colors uppercase tracking-wider"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("input")}
              className="pixel-btn text-[10px] md:text-xs uppercase px-4 py-2"
            >
              Get Roasted
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
