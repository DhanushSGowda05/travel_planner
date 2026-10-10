import {
  Clock,
  Navigation,
  DollarSign,
  Coffee,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/* ---------- CATEGORY ICON ---------- */
const getCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case "food":
      return <Coffee className="w-4 h-4" />;
    case "restaurants":
      return <Utensils className="w-4 h-4" />;
    default:
      return null;
  }
};

/* ---------- FORMAT DURATION ---------- */
const formatDuration = (hours) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export function PlaceCard({
  place,
  index,
  isSelected,
  onSelect,
  meals, // optional – only passed for LUNCH_BREAK
}) {
  const isLunchBreak = place.id === "LUNCH_BREAK";
  const isBreak = isLunchBreak || place.category === "Food";

  const hasMeals =
    meals &&
    (meals.breakfast?.length ||
      meals.lunch?.length ||
      meals.dinner?.length);

  const displayName = isLunchBreak ? "Meals" : place.name;

  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        onClick={onSelect}
        className={cn(
          `
          relative p-4 rounded-xl border cursor-pointer
          transition-all duration-300 ease-out
          group
          `,
          "bg-white border-slate-200 hover:bg-slate-50 hover:shadow-sm",
          isSelected &&
            "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-md",
          isBreak &&
            "bg-amber-50 border-amber-200 hover:bg-amber-50"
        )}
      >
        {/* Left accent (selected only) */}
        {isSelected && (
          <span className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-cyan-500 to-blue-600" />
        )}

        <div className="flex gap-4">
          {/* ---------- INDEX / ICON ---------- */}
          <div className="flex items-start">
            <div
              className={cn(
                `
                w-8 h-8 rounded-full
                flex items-center justify-center
                text-sm font-semibold shrink-0
                transition-colors
                `,
                isBreak
                  ? "bg-amber-500 text-white"
                  : isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
              )}
            >
              {isBreak ? getCategoryIcon(place.category) : index + 1}
            </div>
          </div>

          {/* ---------- CONTENT ---------- */}
          <div className="flex-1 min-w-0">
            {/* Title + Category */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3
                className={cn(
                  "font-medium truncate",
                  isSelected ? "text-slate-900" : "text-slate-800"
                )}
              >
                {displayName}
              </h3>

              <Badge
                variant="secondary"
                className={cn(
                  "text-xs shrink-0",
                  isBreak && "bg-amber-100 text-amber-700 border-0"
                )}
              >
                {place.category}
              </Badge>
            </div>

            {/* Description */}
            {place.description && (
              <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                {place.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mb-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {place.start_time}
                {place.end_time && ` – ${place.end_time}`}
              </span>

              <span className="flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5" />
                {formatDuration(place.time_duration_hours)}
              </span>

              {typeof place.price === "number" && place.price > 0 && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  ₹{place.price}
                </span>
              )}
            </div>

            {/* Smart score */}
            {!isBreak && place.smart_score && (
              <div className="text-xs text-slate-400">
                Smart score · {place.smart_score.toFixed(1)}
              </div>
            )}

            {/* ---------- MEALS (ONLY FOR MEALS CARD) ---------- */}
            {isLunchBreak && hasMeals && (
              <div className="mt-4 pt-4 border-t border-amber-200 space-y-4">
                {["breakfast", "lunch", "dinner"].map(
                  (type) =>
                    meals[type]?.length > 0 && (
                      <div key={type}>
                        {/* Meal type heading */}
                        <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">
                          {type}
                        </div>

                        {/* Meal mini cards */}
                        <div className="space-y-2">
                          {meals[type].map((item, idx) => (
                            <div
                              key={idx}
                              className="
                                rounded-lg border border-amber-200
                                bg-white/70 px-3 py-2
                                hover:bg-white hover:shadow-sm
                                transition
                              "
                            >
                              <div className="text-sm font-medium text-slate-800 truncate">
                                {item.name}
                              </div>

                              {item.address && (
                                <div className="text-xs text-slate-500 truncate">
                                  {item.address}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
