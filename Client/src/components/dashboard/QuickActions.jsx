import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays, History, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const navigate = useNavigate();
  return (
    
    <div className="flex flex-wrap items-center justify-start gap-4 mt-10">
      {/* ➕ Plan New Trip */}
      <Button
        size="lg"
        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 gap-2"
        onClick={() => navigate("/trip/new")}    
      >
        <Plus className="h-5 w-5" />
        Plan New Trip
      </Button>


      {/* 🧭 Explore */}
      <Button
        size="lg"
        variant="ghost"
        className="text-slate-700 hover:text-cyan-700 hover:bg-cyan-50 gap-2"
      >
        <Compass className="h-5 w-5" />
        Explore
      </Button>
    </div>
  );
}
