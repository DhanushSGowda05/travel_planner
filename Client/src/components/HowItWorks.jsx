import React from "react";
import { MapPin, Plane, Calendar, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    title: "Enter Your Details",
    description:
      "Tell us your origin, destination, travel dates, budget, and preferences. The more we know, the better your itinerary.",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    icon: Plane,
    title: "Compare Transport Options",
    description:
      "We'll show you flights, trains, and buses with real prices and timing. Choose what works best for your schedule and budget.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Calendar,
    title: "Generate Your Itinerary",
    description:
      "Smart planning creates a day-by-day plan with attractions, restaurants, and activities timed perfectly, including travel time and breaks.",
    color: "from-sky-500 to-sky-600",
  },
  {
    icon: CheckCircle2,
    title: "Ready-to-Go Schedule",
    description:
      "Get an instant, editable itinerary with maps, budgets, and booking links. Adjust on the fly and share with travel companions.",
    color: "from-teal-500 to-teal-600",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            How It Works
          </h2>
          <p className="mt-6 text-lg text-slate-600">
            From idea to itinerary in four simple steps. Start planning your perfect trip today.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <div className="flex gap-6">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-lg`}
                      >
                        <Icon className="h-7 w-7" />
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-900 font-medium">
                          {index + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Connecting Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-20 left-7 w-px h-24 bg-gradient-to-b from-slate-300 to-transparent"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
