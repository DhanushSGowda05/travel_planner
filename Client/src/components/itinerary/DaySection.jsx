import { useState } from "react";
import { ChevronDown, ChevronRight, Clock } from "lucide-react";
import { PlaceCard } from "./PlaceCard";

export default function DaySection({
  day,
  selectedPlaceId,
  onSelectPlace,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const dateObj = new Date(day.date);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Total duration
  const totalDuration = day.places.reduce(
    (acc, p) => acc + (p.time_duration_hours || 0),
    0
  );
  const hours = Math.floor(totalDuration);
  const minutes = Math.round((totalDuration - hours) * 60);

  return (
    <section
      className="
        rounded-2xl bg-white shadow-sm border
        transition-all duration-300
        hover:shadow-md
      "
    >
      {/* ---------- HEADER ---------- */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          w-full flex items-center justify-between
          px-6 py-5 text-left
          rounded-2xl
          hover:bg-slate-50
          transition-colors
        "
      >
        <div className="flex items-start gap-4">
          <div className="mt-1 text-slate-400">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {formattedDate}
            </h2>
            <div className="text-sm text-slate-500">
              {day.day}
            </div>
          </div>
        </div>

        {totalDuration > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            {hours}h {minutes}m planned
          </div>
        )}
      </button>

      {/* ---------- CONTENT ---------- */}
      <div
        className={`
          grid transition-all duration-300 ease-in-out
          ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}
        `}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-6 pt-2">
            {day.places.length > 0 ? (
              <div className="space-y-4">
                {day.places.map((place, index) => (
                  <PlaceCard
                    key={String(place.id)}
                    place={place}
                    index={index}
                    isSelected={selectedPlaceId === String(place.id)}
                    onSelect={() => onSelectPlace(place)}
                    meals={place.id === "LUNCH_BREAK" ? day.meals : null}
                  />
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-slate-400">
                No places added for this day yet
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
