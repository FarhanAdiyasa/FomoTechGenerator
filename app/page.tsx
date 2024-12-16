"use client";

import Header from "./pages/Header";
import HeroSection from "./pages/HeroSection";
import Features from "./pages/Features";
import Testimonials from "./pages/Testimonials";
import InputSection from "./pages/InputSections";

export default function Home() {
  return (
    <main className="bg-gray-50 min-h-screen">
      <Header />
      <section id="hero" className="fade-in">
        <HeroSection />
      </section>
      <section id="features" className="fade-in">
        <Features />
      </section>
      {/* <section id="testimonials" className="fade-in">
        <Testimonials />
      </section> */}
      <section id="input" className="fade-in">
        <InputSection />
      </section>
    </main>
  );
}
