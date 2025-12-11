import React from "react";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { MyTrips } from "@/components/dashboard/MyTrips";
import { TravelInsights } from "@/components/dashboard/TravelInsights";
import { Recommendations } from "@/components/dashboard/Recommendations";

export function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky Navbar */}
      <DashboardNavbar />

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 lg:px-8 py-10 space-y-16">
        
        {/* Welcome Section */}
        <section className="space-y-8">
          <WelcomeBanner />
        </section>

        {/* Quick Actions */}
        <section className="mt-4">
          <QuickActions />
        </section>

        {/* My Trips (StatsGrid is inside this) */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">🧳 Your Trips</h2>
          <MyTrips />
        </section>

        {/* Travel Insights */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">📊 Your Travel Insights</h2>
          <TravelInsights />
        </section>

        {/* Recommended Destinations */}
        <section className="mt-12 mb-16">
          <Recommendations />
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;
