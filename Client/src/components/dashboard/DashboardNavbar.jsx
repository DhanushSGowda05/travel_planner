import React from "react";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../context/AuthContext";

export function DashboardNavbar() {
  const { logout, user } = useAuth();

  const scrollToTrips = () => {
    const section = document.getElementById("mytrips-section");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 h-16 rounded-b-md lg:px-8">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <span className="text-slate-900 font-semibold text-lg">
            TripCraft
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-slate-700 font-medium">
          <a href="#home" className="hover:text-cyan-600 transition-colors">Home</a>

          {/* Scroll to MyTrips */}
          <button
            onClick={scrollToTrips}
            className="hover:text-cyan-600 transition-colors"
          >
            My Trips
          </button>
        </nav>

        {/* Profile & Logout */}
        <div className="flex items-center gap-2">
          <span className="text-slate-800 font-medium">{user?.name}</span>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
