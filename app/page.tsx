"use client";

import Header from "./pages/Header";
import HeroSection from "./pages/HeroSection";
import Features from "./pages/Features";
import InputSection from "./pages/InputSections";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      <Header />
      <section id="hero" className="fade-in">
        <HeroSection />
      </section>
      <section id="features" className="fade-in">
        <Features />
      </section>
      <section id="input" className="fade-in">
        <InputSection />
      </section>
    </main>
  );
}
