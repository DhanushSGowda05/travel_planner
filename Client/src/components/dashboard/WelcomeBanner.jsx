import React from "react";
import { useAuth } from "../../context/AuthContext";

export function WelcomeBanner() {
  const { user } = useAuth();
  return (
    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100 rounded-2xl p-6 sm:p-8 shadow-sm">
      <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">
        Welcome, {user?.name || "Traveller"} 👋
      </h1>
      <p className="text-slate-600 text-lg">
        You’ve planned <span className="font-semibold text-cyan-600">5 trips</span> across <span className="font-semibold text-blue-600">3 cities</span>. ✈️
      </p>
    </div>
  );
}
