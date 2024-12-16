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
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isHeroSectionVisible ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="flex justify-between items-center px-8 py-4">
        {/* Branding */}
        <div className="text-3xl font-extrabold text-blue-600">
          Tech <span className="text-yellow-300">FOMO</span>
        </div>

        {/* Navigation */}
        <nav className="space-x-6">
          <button
            onClick={() => scrollToSection("hero")}
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection("features")}
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            Features
          </button>
          {/* <button
            onClick={() => scrollToSection("testimonials")}
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            Testimonials
          </button> */}
        </nav>
      </div>
    </header>
  );
}
