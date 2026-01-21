import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useParams } from "react-router-dom";

import AppSidebar from "@/components/itinerary/AppSidebar";
import ItineraryPanel from "@/components/itinerary/ItineraryPanel";
import MapPanel from "@/components/itinerary/MapPanel";

import { getItineraryFromDB, runIlpSolver } from "@/services/tripService";

/* ----------------------------------------
   Normalize ILP response → Trip shape
---------------------------------------- */
function normalizeIlpResponse(ilpData, tripId) {
  const dates = Object.keys(ilpData).sort();

  return {
    id: String(tripId),
    name: "Generated Trip",
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    itinerary: ilpData,
  };
}

export default function ItineraryPage() {
  /* ------------------ STATE ------------------ */
  const [trip, setTrip] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const { tripId } = useParams();

  /* ------------------ FETCH ITINERARY ------------------ */
  useEffect(() => {
    if (!tripId) return;

    const loadItinerary = async () => {
      // 1️⃣ Try DB first
      const dbItinerary = await getItineraryFromDB(tripId);

      if (dbItinerary) {
        setTrip(normalizeIlpResponse(dbItinerary, tripId));
        return;
      }

      // 2️⃣ Fallback to ILP
      const ilpResponse = await runIlpSolver({
        trip_id: tripId,
      });

      setTrip(normalizeIlpResponse(ilpResponse, tripId));
    };

    loadItinerary();
  }, [tripId]);

  /* ------------------ DERIVED DATA ------------------ */
  const sortedDates = useMemo(() => {
    if (!trip?.itinerary) return [];
    return Object.keys(trip.itinerary).sort();
  }, [trip]);

  useEffect(() => {
    if (!selectedDate && sortedDates.length > 0) {
      setSelectedDate(sortedDates[0]);
    }
  }, [sortedDates, selectedDate]);

  const currentDayIndex = useMemo(() => {
    return sortedDates.findIndex(
      (d) => d === selectedDate
    );
  }, [sortedDates, selectedDate]);

  const currentDay = useMemo(() => {
    if (!trip || !selectedDate) return null;
    return trip.itinerary[selectedDate];
  }, [trip, selectedDate]);

  const allPlacesForCurrentDay =
    currentDay?.places || [];

  const daysArray = useMemo(() => {
    if (!trip?.itinerary) return [];
    return sortedDates.map(
      (date) => trip.itinerary[date]
    );
  }, [sortedDates, trip]);

  /* ------------------ HANDLERS ------------------ */
  const handleSelectPlace = useCallback(
    (place) => {
      setSelectedPlace(place);

      if (place && trip?.itinerary) {
        const dateWithPlace = sortedDates.find(
          (date) =>
            trip.itinerary[date].places.some(
              (p) => p.id === place.id
            )
        );

        if (dateWithPlace) {
          setSelectedDate(dateWithPlace);
        }
      }
    },
    [sortedDates, trip]
  );

  const handleNavigateDay = useCallback(
    (direction) => {
      const newIndex =
        direction === "prev"
          ? currentDayIndex - 1
          : currentDayIndex + 1;

      if (
        newIndex >= 0 &&
        newIndex < sortedDates.length
      ) {
        setSelectedDate(sortedDates[newIndex]);
        setSelectedPlace(null);
      }
    },
    [currentDayIndex, sortedDates]
  );

  /* ------------------ UI ------------------ */
  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {!trip ? (
        <div className="flex-1 flex items-center justify-center">
          Loading itinerary...
        </div>
      ) : (
        <>
          {/* Sidebar */}
          <AppSidebar
            days={daysArray}
            selectedDate={selectedDate}
            onSelectDay={setSelectedDate}
            isOpen={sidebarOpen}
            onToggle={() =>
              setSidebarOpen(!sidebarOpen)
            }
          />

          {/* Main Content */}
          <div className="flex-1 flex min-w-0">
            {/* Itinerary Panel */}
            <div className="w-[40%] min-w-[360px] border-r border-border">
              <ItineraryPanel
                tripName={trip.name}
                startDate={trip.startDate}
                endDate={trip.endDate}
                days={daysArray}
                selectedPlaceId={
                  selectedPlace
                    ? String(selectedPlace.id)
                    : null
                }
                selectedDate={selectedDate}
                onSelectPlace={handleSelectPlace}
              />
            </div>

            {/* Map Panel */}
            <div className="flex-1">
              <MapPanel
                places={allPlacesForCurrentDay}
                selectedPlace={selectedPlace}
                onSelectPlace={handleSelectPlace}
                currentDayIndex={currentDayIndex}
                totalDays={sortedDates.length}
                onNavigateDay={handleNavigateDay}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
