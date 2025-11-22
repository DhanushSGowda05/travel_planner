import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Star, CalendarDays, Wallet } from "lucide-react";

const insights = [
  {
    icon: Wallet,
    color: "from-cyan-500 to-blue-600",
    text: "You’ve spent 38% of your total travel budget on accommodation.",
  },
  {
    icon: Star,
    color: "from-yellow-400 to-orange-500",
    text: "Your average trip rating is 4.6 ⭐ — great choices so far!",
  },
  {
    icon: CalendarDays,
    color: "from-teal-500 to-cyan-600",
    text: "You travel most during December and January — peak holiday season!",
  },
  {
    icon: PieChart,
    color: "from-indigo-500 to-violet-600",
    text: "You prefer 4-day trips on average, with mid-range budgets.",
  },
];

export function TravelInsights() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {insights.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card
            key={index}
            className="border border-slate-200 hover:shadow-md transition-shadow bg-white"
          >
            <CardContent className="flex items-start gap-4 p-6">
              {/* Gradient Icon */}
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-sm flex-shrink-0`}
              >
                <Icon className="h-6 w-6" />
              </div>

              {/* Text */}
              <p className="text-slate-700 text-base">{item.text}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
