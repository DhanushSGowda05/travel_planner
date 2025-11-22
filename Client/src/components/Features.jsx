import React from "react";
import { MapPin, Clock, DollarSign, Sparkles, Calendar, Plane } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const features = [
  {
    icon: Calendar,
    title: "Multi-Day Planning",
    description: "Get complete day-by-day itineraries with perfectly timed activities, attractions, and meals.",
  },
  {
    icon: Clock,
    title: "Real Attraction Timing",
    description: "Schedules include actual opening hours, travel time between locations, and recommended visit durations.",
  },
  {
    icon: DollarSign,
    title: "Budget Management",
    description: "Track costs for every activity, meal, and transport. Stay within your budget effortlessly.",
  },
  {
    icon: Plane,
    title: "Transport Comparison",
    description: "Compare flights, trains, and buses side-by-side with real prices and schedules.",
  },
  {
    icon: Sparkles,
    title: "Smart Optimization",
    description: "Intelligent routing minimizes travel time and maximizes your experience at each destination.",
  },
  {
    icon: MapPin,
    title: "Interactive Maps",
    description: "Visual maps show your daily route with all attractions, restaurants, and transport stops.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything You Need for the Perfect Trip
          </h2>
          <p className="mt-6 text-lg text-slate-600">
            Powerful features that take the stress out of travel planning. From budget tracking to smart routing — we’ve got you covered.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:max-w-none lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="border-slate-200 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <CardContent className="p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-slate-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
