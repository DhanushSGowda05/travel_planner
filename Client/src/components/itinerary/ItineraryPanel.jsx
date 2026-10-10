import { Calendar, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DaySection from "./DaySection";

export default function ItineraryPanel({
  tripName,
  startDate,
  endDate,
  days,
  selectedDayId,
  selectedPlaceId,
  onSelectPlace,
}) {
  const navigate = useNavigate();

  const formatRange = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    return `${s.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} – ${e.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* ---------- HEADER ---------- */}
      <div className="px-8 pt-6 pb-1.5 bg-white border-b flex justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-slate-500 hover:text-slate-900 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Itinerary
          </h1>
        </div>

        {/* Trip context */}
        <div className="mt-2 text-sm text-slate-500 truncate">
          {tripName}
        </div>

        {/* Date range badge */}
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-4 py-1.5 text-sm font-medium">
          <Calendar className="w-4 h-4" />
          {formatRange()}
        </div>
      </div>

      {/* ---------- DAY SECTIONS ---------- */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 scroll-smooth">
        <div className="max-w-[720px] mx-auto space-y-10">
          {days.map((day) => (
            <DaySection
              key={day.date}
              day={day}
              isActiveDay={day.id === selectedDayId}
              selectedPlaceId={selectedPlaceId}
              onSelectPlace={onSelectPlace}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
