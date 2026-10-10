import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const recommendations = [
  {
    emoji: "❄️",
    destination: "Manali",
    days: 3,
    cost: "₹20,000",
  },
  {
    emoji: "🌿",
    destination: "Munnar",
    days: 3,
    cost: "₹15,000",
  },
  {
    emoji: "🏰",
    destination: "Hyderabad",
    days: 3,
    cost: "₹12,000",
  },
];

export function Recommendations() {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">
        🌍 Recommended Destinations
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.map((rec, index) => (
          <Card
            key={index}
            className="border border-slate-200 rounded-xl hover:shadow-md transition-all bg-white"
          >
            <CardContent className="p-8 text-center">
              {/* Emoji / Icon */}
              <div className="text-5xl mb-3">{rec.emoji}</div>

              {/* Destination Name */}
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {rec.destination}
              </h3>

              {/* Cost Info */}
              <p className="text-slate-600 mb-6">
                Avg. {rec.days}-Day Cost:{" "}
                <span className="font-semibold">{rec.cost}</span>
              </p>

              {/* Button */}
              <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                Plan Trip
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
