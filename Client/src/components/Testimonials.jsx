import React from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    content:
      "This tool is a game-changer! Planned my entire 10-day Europe trip in under an hour. The budget breakdowns were spot-on and saved me from overspending.",
    author: "Jessica Martinez",
    role: "Solo Traveler",
    avatar: "",
    initials: "JM",
    location: "Spain → Italy → France",
  },
  {
    content:
      "Loved how it compared all transport options. Ended up taking a scenic train instead of flying, which was cheaper and more enjoyable. The itinerary was perfect!",
    author: "David Chen",
    role: "Family Vacation",
    avatar: "",
    initials: "DC",
    location: "London → Edinburgh",
  },
  {
    content:
      "Best trip planner I've used. The day-by-day schedule included meal breaks and realistic timing. Nothing felt rushed and we saw everything we wanted.",
    author: "Sarah Williams",
    role: "Group Trip Organizer",
    avatar:
      "https://images.unsplash.com/photo-1497184380246-bde200db36c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    initials: "SW",
    location: "Tokyo, Japan",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 sm:py-32 bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Loved by Travelers Worldwide
          </h2>
          <p className="mt-6 text-lg text-slate-600">
            Join thousands of happy travelers who’ve planned their perfect trips with us.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:max-w-none lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="border-slate-200 bg-white hover:shadow-xl transition-all duration-300"
            >
              <CardContent className="p-8">
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="text-slate-700 mb-6 leading-relaxed">
                  {testimonial.content}
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-4 mb-4">
                  <Avatar>
                    <AvatarImage
                      src={testimonial.avatar}
                      alt={testimonial.author}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-slate-900 font-semibold">
                      {testimonial.author}
                    </p>
                    <p className="text-slate-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="text-slate-500 border-t border-slate-100 pt-4 text-sm">
                  {testimonial.location}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
