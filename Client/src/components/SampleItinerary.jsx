import React from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Clock,
  DollarSign,
  MapPin,
  Coffee,
  UtensilsCrossed,
  Camera,
} from "lucide-react";

// ✅ You can replace this with your own Image component if needed.
const ImageWithFallback = ({ src, alt, className }) => (
  <img src={src} alt={alt} className={className} loading="lazy" />
);

const sampleDay = [
  {
    time: "9:00 AM",
    duration: "2 hours",
    title: "Eiffel Tower",
    type: "attraction",
    icon: Camera,
    description:
      "Skip-the-line tickets recommended. Arrive early to beat crowds.",
    cost: "₹2,500",
    location: "Champ de Mars",
  },
  {
    time: "11:30 AM",
    duration: "1 hour",
    title: "Café de Flore",
    type: "meal",
    icon: Coffee,
    description:
      "Iconic Parisian café. Try the croissants and café au lait.",
    cost: "₹1,500",
    location: "Saint-Germain-des-Prés",
  },
  {
    time: "1:00 PM",
    duration: "2.5 hours",
    title: "Louvre Museum",
    type: "attraction",
    icon: Camera,
    description:
      "Pre-book tickets online. Highlights: Mona Lisa, Venus de Milo.",
    cost: "₹1,800",
    location: "Rue de Rivoli",
  },
  {
    time: "4:00 PM",
    duration: "30 min",
    title: "Travel & Break",
    type: "transit",
    icon: MapPin,
    description:
      "Metro Line 1 to Tuileries Garden. Short walk along the Seine.",
    cost: "₹165",
    location: "",
  },
  {
    time: "7:00 PM",
    duration: "2 hours",
    title: "Le Comptoir du Relais",
    type: "meal",
    icon: UtensilsCrossed,
    description:
      "Traditional French bistro. Reservations highly recommended.",
    cost: "₹4,600",
    location: "Odéon",
  },
];

export function SampleItinerary() {
  return (
    <section id="sample" className="py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            See What You’ll Get
          </h2>
          <p className="mt-6 text-lg text-slate-600">
            Here's a preview of what your personalized itinerary looks like —
            every detail planned, timed, and budgeted.
          </p>
        </div>

        {/* Itinerary Layout */}
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side: Day Plan */}
            <div className="lg:col-span-2 space-y-6">
              {/* Day Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-6 rounded-2xl shadow-md">
                <div>
                  <h3 className="text-white text-xl font-semibold">
                    Day 1 – Paris, France
                  </h3>
                  <p className="mt-1 text-cyan-100">Monday, November 3, 2025</p>
                </div>
                <div className="text-right">
                  <p className="text-cyan-100 text-sm">Total Budget</p>
                  <p className="text-white text-lg font-semibold">₹10,565</p>
                </div>
              </div>

              {/* Day Activities */}
              <div className="space-y-4">
                {sampleDay.map((item, index) => {
                  const Icon = item.icon;
                  const typeColor =
                    item.type === "meal"
                      ? "bg-orange-100 text-orange-700 border-orange-200"
                      : item.type === "transit"
                      ? "bg-slate-100 text-slate-700 border-slate-200"
                      : "bg-cyan-100 text-cyan-700 border-cyan-200";

                  return (
                    <Card
                      key={index}
                      className="border-slate-200 hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          {/* Icon and Time */}
                          <div className="flex-shrink-0 text-center">
                            <div
                              className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${typeColor} border`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <p className="mt-2 text-slate-900 font-medium">
                              {item.time}
                            </p>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                              <h4 className="text-slate-900 font-semibold">
                                {item.title}
                              </h4>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.duration}
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                  
                                  {item.cost}
                                </Badge>
                              </div>
                            </div>

                            <p className="text-slate-600 mb-2 text-sm sm:text-base">
                              {item.description}
                            </p>

                            {item.location && (
                              <div className="flex items-center gap-1 text-slate-500 text-sm">
                                <MapPin className="h-3 w-3" />
                                <span>{item.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Summary & Includes */}
            <div className="space-y-6">
              {/* Trip Summary */}
              <Card className="border-slate-200 overflow-hidden shadow-sm">
                <div className="aspect-[4/3] bg-slate-100">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1080&auto=format&fit=crop"
                    alt="Paris cityscape"
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-slate-900 font-semibold mb-4">
                    Trip Summary
                  </h3>
                  <div className="space-y-3 text-sm sm:text-base">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Duration</span>
                      <span className="text-slate-900 font-medium">5 Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Budget</span>
                      <span className="text-slate-900 font-medium">₹52,825</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Activities</span>
                      <span className="text-slate-900 font-medium">
                        18 Planned
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Transport</span>
                      <span className="text-slate-900 font-medium">
                        Flight + Metro
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* What's Included */}
              <Card className="border-slate-200 bg-gradient-to-br from-cyan-50 to-blue-50 shadow-sm">
                <CardContent className="p-6">
                  <h4 className="text-slate-900 font-semibold mb-3">
                    What’s Included
                  </h4>
                  <ul className="space-y-2 text-slate-700">
                    {[
                      "Day-by-day schedule",
                      "Interactive maps",
                      "Budget breakdown",
                      "Booking links",
                      "Local tips & insights",
                    ].map((text, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-cyan-600 mt-1">✓</span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
