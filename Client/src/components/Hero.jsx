import React from "react";
import { Sparkles } from "lucide-react";
import heroImage from "../assets/hero.png";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-black py-24 sm:py-32 lg:py-40">
      
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="World destinations"
          className="h-full w-full object-cover"
        />

        {/* Dark Transparent Overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"></div>
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 text-center">
        
        {/* Highlight Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white mb-8">
          <Sparkles className="h-4 w-4" />
          <span className="font-bold text-[15px]">Smart Itinerary Generation</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-xl">
          Effortlessly Plan Your Dream Trip in Seconds
        </h1>

        {/* Subtitle */}
        <p className="mt-8 text-lg sm:text-xl text-white/90 max-w-3xl mx-auto drop-shadow-md">
          Get a multi-day, budget-friendly itinerary tailored to your interests and real-world constraints.
          From transport comparisons to perfectly timed activities — we handle it all.
        </p>

        {/* Removed CTA Buttons */}

        {/* Trust Indicators */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 lg:gap-12 text-white/90">
          <div className="text-center">
            <p className="text-2xl font-bold drop-shadow">50,000+</p>
            <p className="text-white/70 drop-shadow">Trips Planned</p>
          </div>

          <div className="h-12 w-px bg-white/30"></div>

          <div className="text-center">
            <p className="text-2xl font-bold drop-shadow">4.9/5</p>
            <p className="text-white/70 drop-shadow">User Rating</p>
          </div>

          <div className="h-12 w-px bg-white/30"></div>

          <div className="text-center">
            <p className="text-2xl font-bold drop-shadow">195</p>
            <p className="text-white/70 drop-shadow">Countries Covered</p>
          </div>
        </div>
      </div>
    </section>
  );
}
