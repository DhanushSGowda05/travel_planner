import React from "react";
import { Button } from "./ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import {Link } from "react-router-dom";

import heroImage from "../assets/hero.png"; 

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cyan-50 via-blue-50 to-white py-24 sm:py-32 lg:py-40">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-cyan-900/90 via-blue-900/85 to-cyan-900/90"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>

        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1527547637224-a93d42c7b332?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
          alt="World travel destinations"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Highlight Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white mb-8">
            <Sparkles className="h-4 w-4" />
            <span className="font-bold text-[15px]">Smart Itinerary Generation</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-lg">
            Effortlessly Plan Your Dream Trip in Seconds
          </h1>

          {/* Subtitle */}
          <p className="mt-8 text-lg sm:text-xl text-cyan-100 drop-shadow max-w-3xl mx-auto">
            Get a multi-day, budget-friendly itinerary tailored to your interests and real-world constraints.
            From transport comparisons to perfectly timed activities — we handle it all.
          </p>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="default" className="gap-2 text-lg px-8">
              Create Your Itinerary
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-white/30 text-white hover:bg-white/10 hover:text-cyan-50"
            >
              View Sample Trip
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 lg:gap-12 text-white/90">
            <div className="text-center">
              <p className="text-2xl font-bold drop-shadow">50,000+</p>
              <p className="text-cyan-200 drop-shadow">Trips Planned</p>
            </div>
            <div className="h-12 w-px bg-white/30"></div>
            <div className="text-center">
              <p className="text-2xl font-bold drop-shadow">4.9/5</p>
              <p className="text-cyan-200 drop-shadow">User Rating</p>
            </div>
            <div className="h-12 w-px bg-white/30"></div>
            <div className="text-center">
              <p className="text-2xl font-bold drop-shadow">195</p>
              <p className="text-cyan-200 drop-shadow">Countries Covered</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
