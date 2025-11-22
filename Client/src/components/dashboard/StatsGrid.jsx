import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Plane, Clock, Wallet, MapPin } from "lucide-react";

const stats = [
  {
    label: "Total Trips",
    value: "5",
    icon: Plane,
    color: "from-cyan-500 to-blue-500",
  },
  {
    label: "Avg. Duration",
    value: "4 days",
    icon: Clock,
    color: "from-sky-500 to-indigo-500",
  },
  {
    label: "Total Spent",
    value: "₹72,000",
    icon: Wallet,
    color: "from-teal-500 to-cyan-600",
  },
  {
    label: "Fav Destination",
    value: "Goa 🏖️",
    icon: MapPin,
    color: "from-blue-500 to-violet-500",
  },
];

export function StatsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
      {stats.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card
            key={index}
            className="border border-slate-200 shadow-sm hover:shadow-md transition-all"
          >
            <CardContent className="flex items-center gap-4 p-5">
              {/* Icon */}
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-md`}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Text */}
              <div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="text-lg font-semibold text-slate-900">
                  {item.value}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
