"use client";

import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import Features from "./components/Features";
import InputSection from "./components/InputSections";

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
