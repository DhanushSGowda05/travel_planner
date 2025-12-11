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

  useEffect(() => {
    if (!selectedPlaceId) return;

    setIsExpanded(true);

    const el = cardRefs.current[selectedPlaceId];
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedPlaceId]);

  const dateObj = new Date(day.date);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
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

          <h2 className="font-semibold text-lg text-gray-900">{formattedDate}</h2>
        </div>

        <div></div>
      </div>

      {/* CONTENT */}
      {isExpanded && (
        <div className="px-4 pb-4 relative overflow-visible z-10">

          {/* PLACE CARDS */}
          {day.places.length > 0 ? (
            <div className="space-y-4 mb-6">
              {day.places.map((place, index) => (
                <div
                  key={place.id}
                  ref={(el) => (cardRefs.current[place.id] = el)}
                >
                  <PlaceCard
                    place={place}
                    index={index}
                    isSelected={selectedPlaceId === place.id}
                    isEditMode={isEditMode}
                    onSelect={() => onSelectPlace(place)}
                    onDelete={() => onDeletePlace?.(place.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No places added for this day.</p>
              <p className="text-sm">Start by searching a place below.</p>
            </div>
          )}

          {/* ADD PLACE INPUT */}
          {isEditMode && (
            <div className="relative mb-63 z-30">
              <AddPlaceInput onAdd={(placeObj) => onAddPlace(day.id, placeObj)} />

            </div>
          )}

        </div>
      )}
    </div>
  );
}
