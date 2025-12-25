import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import PlaceCard from "./PlaceCard";
import { AddPlaceInput } from "./AddPlaceInput";

export default function DaySection({
  day,
  selectedPlaceId,
  isEditMode,
  onSelectPlace,
  onDeletePlace,
  onAddPlace,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const cardRefs = useRef({});

  /* -----------------------------------
     Auto-scroll to selected item
  ----------------------------------- */
  useEffect(() => {
    if (!selectedPlaceId) return;

    setIsExpanded(true);

    const el = cardRefs.current[selectedPlaceId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedPlaceId]);

  /* -----------------------------------
     Format date
  ----------------------------------- */
  const formattedDate = new Date(day.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-visible relative">

      {/* HEADER */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}

          <h2 className="font-semibold text-lg text-gray-900">
            {formattedDate}
          </h2>
        </div>
      </div>

      {/* CONTENT */}
      {isExpanded && (
        <div className="px-4 pb-4 relative overflow-visible z-10">

          {/* TIMELINE CARDS */}
          {day.places.length > 0 ? (
            <div className="space-y-4 mb-6">
              {day.places.map((item, index) => {
                const isMeal = item.type === "meal";

                return (
                  <div
                    key={item.id}
                    ref={(el) => (cardRefs.current[item.id] = el)}
                  >
                    {/* ---------- MEAL CARD ---------- */}
                    {isMeal ? (
                      <div
                        onClick={() => onSelectPlace(item.id)}
                        className={`
                          cursor-pointer rounded-xl border p-4 transition
                          ${
                            selectedPlaceId === item.id
                              ? "ring-2 ring-orange-400 border-orange-400"
                              : "border-orange-300"
                          }
                          bg-orange-50
                        `}
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-semibold">
                            🍴
                          </div>

                          <h3 className="font-semibold text-gray-900">
                            {item.name}
                          </h3>

                          <span className="ml-auto text-xs px-2 py-1 rounded-full bg-orange-200 text-orange-800">
                            Food
                          </span>
                        </div>

                        <p className="text-sm text-gray-600">
                          {item.description || "Time for food and rest."}
                        </p>

                        <div className="mt-2 text-sm text-gray-500">
                          {item.start_time} · {item.duration || "Break"}
                        </div>
                      </div>
                    ) : (
                      /* ---------- NORMAL PLACE CARD ---------- */
                      <PlaceCard
                        place={item}
                        index={index}
                        isSelected={selectedPlaceId === item.id}
                        isEditMode={isEditMode}
                        onSelect={() => onSelectPlace(item)}
                        onDelete={() => onDeletePlace?.(item.id)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No places added for this day.</p>
              <p className="text-sm">Start by searching a place below.</p>
            </div>
          )}

          {/* ADD PLACE INPUT */}
          {isEditMode && (
            <div className="relative z-30">
              <AddPlaceInput
                onAdd={(placeObj) => onAddPlace(day.id, placeObj)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
