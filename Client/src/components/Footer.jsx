import React from "react";
import { Facebook, Twitter, Linkedin, Instagram, Plane } from "lucide-react";

const navigation = {
  product: [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Sample Itinerary", href: "#sample" },
    { name: "Pricing", href: "#" },
  ],
  company: [
    { name: "About Us", href: "#" },
    { name: "Travel Blog", href: "#" },
    { name: "Destinations", href: "#" },
    { name: "Contact", href: "#" },
  ],
  resources: [
    { name: "Help Center", href: "#" },
    { name: "Travel Guides", href: "#" },
    { name: "API Access", href: "#" },
    { name: "Partnerships", href: "#" },
  ],
  legal: [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Cookie Policy", href: "#" },
  ],
};

const socials = [
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "LinkedIn", icon: Linkedin, href: "#" },
  { name: "Facebook", icon: Facebook, href: "#" },
  { name: "Instagram", icon: Instagram, href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-slate-900" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand Section */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">TripCraft</span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-xs">
              Smart travel planning that turns your dream destinations into
              perfectly crafted itineraries.
            </p>
            <div className="flex space-x-6">
              {socials.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    <span className="sr-only">{item.name}</span>
                    <Icon className="h-6 w-6" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            {/* Product + Company */}
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-white font-semibold">Product</h3>
                <ul className="mt-6 space-y-4">
                  {navigation.product.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-white font-semibold">Company</h3>
                <ul className="mt-6 space-y-4">
                  {navigation.company.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Resources + Legal */}
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-white font-semibold">Resources</h3>
                <ul className="mt-6 space-y-4">
                  {navigation.resources.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-white font-semibold">Legal</h3>
                <ul className="mt-6 space-y-4">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="mt-16 border-t border-slate-800 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} TripCraft. All rights reserved.{" "}
            <span className="text-slate-500">
              Travel smarter, not harder ✈️
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
