import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { recommendedPlaces } from "@/data/mockItinerary";

export default function RecommendedPlaces({ onAddPlace }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const scroll = (direction) => {
    const container = document.getElementById("recommended-scroll");
    if (!container) return;

    const amount = 200;
    const newPos =
      direction === "left"
        ? container.scrollLeft - amount
        : container.scrollLeft + amount;

    container.scrollTo({ left: newPos, behavior: "smooth" });
  };

  return (
    <div className="mt-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        Recommended places
      </button>

      {isExpanded && (
        <div className="relative">
          {/* Scroll container */}
          <div
            id="recommended-scroll"
            className="flex gap-4 overflow-x-auto scrollbar-thin pb-2 pr-10"
          >
            {recommendedPlaces.map((place) => (
              <div
                key={place.id}
                className="flex items-center gap-3 shrink-0 group cursor-pointer bg-white p-2 rounded-lg shadow-sm border hover:shadow-md transition"
              >
                {/* Image */}
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name */}
                <div className="max-w-[120px]">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {place.name}
                  </p>
                </div>

                {/* Add Place (+) button */}
                <button
                  onClick={() => onAddPlace?.(place.name)}
                  className="w-7 h-7 rounded-full border flex items-center justify-center 
                             opacity-0 group-hover:opacity-100 transition-opacity 
                             hover:bg-gray-100 border-gray-300"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            ))}
          </div>

          {/* Right arrow */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full 
                       bg-white border border-gray-300 shadow-sm flex items-center justify-center 
                       hover:bg-gray-100 transition"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}
