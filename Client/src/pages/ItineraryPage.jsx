import { useState, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import AppSidebar from "@/components/itinerary/AppSidebar";
import ItineraryPanel from "@/components/itinerary/ItineraryPanel";
import MapPanel from "@/components/itinerary/MapPanel";
import { runIlpSolver } from "@/services/tripService";

/* --------------------------------------------------
   NORMALIZE ILP RESPONSE → FRONTEND SHAPE
-------------------------------------------------- */
const normalizeItinerary = (ilpData) => {
  const days = Object.entries(ilpData).map(([dateKey, day]) => ({
    id: dateKey,
    date: day.date,
    day: day.day,

    // meals is an OBJECT (breakfast/lunch/dinner)
    meals: day.meals || { breakfast: [], lunch: [], dinner: [] },

    places: (day.places || []).map((p, idx) => ({
      id: String(p.id ?? `${dateKey}-${idx}`),
      name: p.name,
      description: p.description || "",
      category: p.category,

      // 🔑 REQUIRED FIX
      lat: p.latitude,
      lng: p.longitude,

      start_time: p.start_time,
      end_time: p.end_time,
      price: p.price,
      smart_score: p.smart_score,
      time_duration_hours: p.time_duration_hours,
    })),
  }));

  return days;
};

export default function ItineraryPage() {
  const { tripId } = useParams();

  const [trip, setTrip] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalTrip, setOriginalTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  /* -----------------------------------
     LOAD ITINERARY FROM ILP
  ----------------------------------- */
  useEffect(() => {
    async function loadItinerary() {
      try {
        const data = await runIlpSolver({ trip_id: tripId });
        const days = normalizeItinerary(data);

        const tripObj = {
          name: "TripCraft Trip",
          startDate: days[0]?.date,
          endDate: days[days.length - 1]?.date,
          days,
        };

        setTrip(tripObj);
        setOriginalTrip(tripObj);
        setSelectedDayId(days[0]?.id || null);
      } catch (err) {
        console.error("ILP solver failed:", err);
      } finally {
        setLoading(false);
      }
    }

    loadItinerary();
  }, [tripId]);

  if (loading || !trip) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Generating itinerary…
      </div>
    );
  }

  const currentDayIndex = trip.days.findIndex((d) => d.id === selectedDayId);
  const currentDay = trip.days[currentDayIndex];
  const placesToday = currentDay?.places || [];

  const toast = ({ title, description }) => {
    console.log("Toast:", title, description);
  };

  /* -----------------------------------
     SELECT PLACE
  ----------------------------------- */
  const handleSelectPlace = useCallback(
    (placeId) => {
      setSelectedPlaceId(placeId);

      const dayContaining = trip.days.find((d) =>
        d.places.some((p) => p.id === placeId)
      );
      if (dayContaining) setSelectedDayId(dayContaining.id);
    },
    [trip.days]
  );

  /* -----------------------------------
     DELETE PLACE
  ----------------------------------- */
  const handleDeletePlace = useCallback(
    (dayId, placeId) => {
      setTrip((prev) => ({
        ...prev,
        days: prev.days.map((d) =>
          d.id === dayId
            ? { ...d, places: d.places.filter((p) => p.id !== placeId) }
            : d
        ),
      }));

      if (selectedPlaceId === placeId) setSelectedPlaceId(null);

      toast({
        title: "Place removed",
        description: "The place has been deleted from your itinerary.",
      });
    },
    [selectedPlaceId]
  );

  /* -----------------------------------
     ADD PLACE (manual add)
  ----------------------------------- */
  const handleAddPlace = useCallback((dayId, placeObj) => {
    if (!placeObj?.lat || !placeObj?.lng) return;

    setTrip((prev) => ({
      ...prev,
      days: prev.days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              places: [
                ...d.places,
                { ...placeObj, id: "p-" + Date.now() },
              ],
            }
          : d
      ),
    }));
  }, []);

  /* -----------------------------------
     EDIT MODE
  ----------------------------------- */
  const handleToggleEditMode = () => {
    if (!isEditMode) setOriginalTrip(trip);
    setIsEditMode(!isEditMode);
  };

  const handleSave = () => {
    setIsEditMode(false);
    toast({
      title: "Changes saved",
      description: "Your itinerary has been updated.",
    });
  };

  const handleCancel = () => {
    setTrip(originalTrip);
    setIsEditMode(false);
    toast({
      title: "Changes discarded",
      description: "All modifications were reverted.",
    });
  };

  /* -----------------------------------
     DAY NAVIGATION
  ----------------------------------- */
  const handleNavigateDay = (dir) => {
    const next = dir === "prev" ? currentDayIndex - 1 : currentDayIndex + 1;
    if (next >= 0 && next < trip.days.length) {
      setSelectedDayId(trip.days[next].id);
      setSelectedPlaceId(null);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <AppSidebar
        days={trip.days}
        selectedDayId={selectedDayId}
        onSelectDay={setSelectedDayId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Right side */}
      <div className="flex-1 flex min-w-0">
        {/* Itinerary Panel */}
        <div className="w-[40%] min-w-[360px] border-r border-gray-200 bg-white hidden md:block">
          <ItineraryPanel
            tripName={trip.name}
            startDate={trip.startDate}
            endDate={trip.endDate}
            days={trip.days}
            selectedPlaceId={selectedPlaceId}
            isEditMode={isEditMode}
            onSelectPlace={(p) => handleSelectPlace(p.id)}
            onDeletePlace={handleDeletePlace}
            onAddPlace={handleAddPlace}
            onToggleEditMode={handleToggleEditMode}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>

        {/* Map Panel */}
        <div className="flex-1 h-full">
          <MapPanel
            places={placesToday}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={handleSelectPlace}
            currentDayIndex={currentDayIndex}
            totalDays={trip.days.length}
            onNavigateDay={handleNavigateDay}
          />
        </div>
      </div>
    </div>
  );
}
