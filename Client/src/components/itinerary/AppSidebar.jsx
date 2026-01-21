import {
  Calendar,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  Plane,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ----------------------------------------
   COLLAPSED SIDEBAR (ICONIC MODE)
----------------------------------------- */
function CollapsedSidebar({ onToggle }) {
  return (
    <div className="w-16 h-full bg-gradient-to-b from-slate-50 to-white border-r flex flex-col items-center py-4 gap-4">
      {/* Brand Logo */}
      <div className="relative group">
        <div className="absolute inset-0 blur-lg bg-blue-400/30 rounded-xl group-hover:opacity-100 opacity-70 transition" />
        <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
          <Plane className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Expand */}
      <button
        onClick={onToggle}
        className="mt-auto p-2 rounded-lg hover:bg-slate-100 transition"
      >
        <ChevronRight className="w-5 h-5 text-slate-600" />
      </button>
    </div>
  );
}

/* ----------------------------------------
   EXPANDED SIDEBAR
----------------------------------------- */
export default function AppSidebar({
  days,
  selectedDate,
  onSelectDay,
  isOpen,
  onToggle,
}) {
  if (!isOpen) {
    return <CollapsedSidebar onToggle={onToggle} />;
  }

  return (
    <div className="w-64 h-full bg-white border-r flex flex-col">
      {/* ---------- BRAND HEADER ---------- */}
      <div className="px-4 py-4 border-b flex items-center gap-3">
        <div className="relative group">
          <div className="absolute inset-0 rounded-xl bg-blue-500/30 blur-md group-hover:blur-lg transition" />
          <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Plane className="h-5 w-5 text-white" />
          </div>
        </div>
        <span className="font-semibold text-lg tracking-tight text-slate-900">
          TripCraft
        </span>
      </div>

      {/* ---------- ITINERARY ---------- */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
          <Calendar className="w-4 h-4" />
          Itinerary
        </div>

        <div className="space-y-1">
          {days.map((day) => {
            const dateObj = new Date(day.date);
            const dayLabel = dateObj.toLocaleDateString("en-US", {
              weekday: "short",
              month: "numeric",
              day: "numeric",
            });

            const placesPreview =
              day.places.length > 0
                ? day.places
                    .filter((p) => p.id !== "LUNCH_BREAK")
                    .slice(0, 2)
                    .map((p) => p.name.split(" ")[0])
                    .join(" • ") +
                  (day.places.length > 2 ? " ..." : "")
                : "";

            const isActive = selectedDate === day.date;

            return (
              <button
                key={day.date}
                onClick={() => onSelectDay(day.date)}
                className={cn(
                  "relative w-full text-left px-4 py-2 rounded-xl transition-all group",
                  isActive
                    ? "bg-gradient-to-r from-blue-50 to-cyan-50 shadow-sm"
                    : "hover:bg-slate-50"
                )}
              >
                {/* Active Indicator */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b from-cyan-500 to-blue-600" />
                )}

                <div
                  className={cn(
                    "font-medium",
                    isActive ? "text-slate-900" : "text-slate-700"
                  )}
                >
                  {dayLabel}
                </div>

                {placesPreview && (
                  <div className="text-xs text-slate-500 truncate">
                    {placesPreview}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ---------- FOOTER ---------- */}
      <div className="p-3 border-t">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition"
        >
          <PanelLeftClose className="w-4 h-4" />
          Hide sidebar
        </button>
      </div>
    </div>
  );
}
