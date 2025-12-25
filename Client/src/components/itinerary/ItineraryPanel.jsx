import { Calendar, Pencil, Save, X, Share2 } from "lucide-react";
import DaySection from "./DaySection";
import { useNavigate } from "react-router-dom";

export default function ItineraryPanel({
  tripName,
  startDate,
  endDate,
  days,
  selectedPlaceId,
  isEditMode,
  onSelectPlace,
  onDeletePlace,
  onAddPlace,
  onToggleEditMode,
  onSave,
  onCancel,
}) {
  const formatRange = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    return `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`;
  };
  const navigate = useNavigate();
  return (
    <div className="h-full flex flex-col bg-white border-r">

      {/* -------------------- TOP BAR -------------------- */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm pb-2.5">

        {/* Left side: logo + trip name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            TC
          </div>
          <h2 className="text-base font-semibold">{tripName || "TripCraft Trip"}</h2>
        </div>

        {/* Right side: Share */}
        
          <button
            onClick={() => navigate("/dashboard")}
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-100 transition"
          >
            ← Back
          </button>
        
      </div>

      {/* -------------------- HEADER -------------------- */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-center justify-between">

          {/* Title + Date Range */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Itinerary</h1>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="px-2 py-1 border rounded-md bg-gray-50 text-gray-700">
                {formatRange()}
              </span>
            </div>
          </div>

          {/* Edit Mode Controls */}
          <div className="flex items-center gap-3">

            {/* Edit button */}
            {!isEditMode && (
              <button
                onClick={onToggleEditMode}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-100"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            )}

            {/* Save + Cancel */}
            {isEditMode && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onCancel}
                  className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>

                <button
                  onClick={onSave}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -------------------- DAYS LIST -------------------- */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {days.map((day) => (
          <DaySection
            key={day.id}
            day={day}
            isEditMode={isEditMode}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={onSelectPlace}
            onDeletePlace={(placeId) => onDeletePlace(day.id, placeId)}
            onAddPlace={(placeName) => onAddPlace(day.id, placeName)}
          />
        ))}
      </div>
    </div>
  );
}
