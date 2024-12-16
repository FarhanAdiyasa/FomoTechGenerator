"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 text-white flex items-center justify-center overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute inset-0 bg-[url('/your-background-pattern.svg')] opacity-10"></div>

      {/* Content */}
      <div className="relative text-center px-6 z-10">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          Enhance Your <span className="text-yellow-300">CV</span> Quality with{" "}
          <br /> <span className="text-pink-300">AI-Driven Feedback</span>
        </h1>
        <p className="text-lg md:text-xl opacity-90 mb-8">
          Instantly receive insights to land your dream job!
        </p>
        <Button
          size="lg"
          className="bg-yellow-300 text-purple-800 hover:bg-yellow-400 transition duration-300 font-bold"
        >
          Get Started <ArrowRight className="ml-2" />
        </Button>
      </div>
    </section>
  );
}
