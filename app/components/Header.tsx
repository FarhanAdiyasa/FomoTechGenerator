"use client";

import { useState, useEffect } from "react";

export default function Header() {
  const [isHeroSectionVisible, setIsHeroSectionVisible] = useState(true);

  // Function to handle smooth scroll
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    // Create the Intersection Observer to track visibility of the sections
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === "features") {
            setIsHeroSectionVisible(entry.isIntersecting);
          }
        });
      },
      {
        threshold: 0.5, // Trigger when at least 50% of the section is in view
      }
    );

    // Observe the hero section
    const heroSection = document.getElementById("hero");
    if (heroSection) {
      observer.observe(heroSection);
    }

    return () => {
      // Cleanup observer on component unmount
      if (heroSection) {
        observer.unobserve(heroSection);
      }
    };
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b-2 ${isHeroSectionVisible
          ? "bg-background/90 backdrop-blur-sm border-white/10"
          : "bg-black border-white"
        }`}
    >
      <div className="container mx-auto flex justify-between items-center px-4 py-4">
        {/* Branding */}
        <div className="text-xl md:text-2xl font-pixel text-primary tracking-tighter cursor-pointer group">
          TECH <span className="text-secondary group-hover:animate-pulse">FOMO</span>
        </div>

        {/* Navigation */}
        <nav className="flex gap-4">
          <button
            onClick={() => scrollToSection("hero")}
            className="font-mono text-lg text-white hover:text-primary transition-colors uppercase"
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection("features")}
            className="font-mono text-lg text-white hover:text-primary transition-colors uppercase"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("input")}
            className="pixel-btn text-xs md:text-sm uppercase"
          >
            Get Roasted
          </button>
        </nav>
      </div>
    </header>
  );
}
