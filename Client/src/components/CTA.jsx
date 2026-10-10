import React from "react";
import { Button } from "./ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTA() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-blue-600 to-sky-700"></div>

      {/* Background Image Overlay */}
      <div className="absolute inset-0 opacity-20">
        <img
          src="https://images.unsplash.com/photo-1644418635118-610d265c32e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
          alt="Travel background"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Foreground Content */}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Start planning in seconds</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Your Next Adventure Awaits
          </h2>

          {/* Subtitle */}
          <p className="mt-6 text-lg text-cyan-100 leading-relaxed">
            Stop spending hours on spreadsheets and endless research. Let our
            smart planner create the perfect itinerary for you in minutes —
            completely free.
          </p>

          {/* Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="default"
              className="gap-2 text-lg px-8 bg-white text-cyan-700 hover:bg-cyan-50"
            >
              Generate My Trip
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-white/30 text-white hover:bg-white/10"
            >
              View Sample Itinerary
            </Button>
          </div>

          {/* Feature Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-blue-100 text-sm">
            {[
              "Free Forever",
              "No Sign-Up Required",
              "Instant Results",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
