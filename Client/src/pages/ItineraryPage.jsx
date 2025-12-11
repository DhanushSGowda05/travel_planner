import { useState, useCallback } from "react";
import AppSidebar from "@/components/itinerary/AppSidebar";
import ItineraryPanel from "@/components/itinerary/ItineraryPanel";
import MapPanel from "@/components/itinerary/MapPanel";
import { mockTrip } from "@/data/mockItinerary";




export default function ItineraryPage() {
    const [trip, setTrip] = useState(mockTrip);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const [selectedDayId, setSelectedDayId] = useState(
        trip.days[0]?.id || null
    );

    const [selectedPlaceId, setSelectedPlaceId] = useState(null);

    const [isEditMode, setIsEditMode] = useState(false);
    const [originalTrip, setOriginalTrip] = useState(mockTrip);

    const currentDayIndex = trip.days.findIndex((d) => d.id === selectedDayId);
    const currentDay = trip.days[currentDayIndex];
    const placesToday = currentDay?.places || [];

    const toast = ({ title, description }) => {
        console.log("Toast:", title, description);
    };

    
    /* -----------------------------------
       SELECT PLACE (from map or panel)
    ----------------------------------- */
    const handleSelectPlace = useCallback(
        (placeId) => {
            setSelectedPlaceId(placeId);

            if (placeId) {
                const dayContaining = trip.days.find((d) =>
                    d.places.some((p) => p.id === placeId)
                );
                if (dayContaining) setSelectedDayId(dayContaining.id);
            }
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
       ADD PLACE (random mock for now)
    ----------------------------------- */
    const handleAddPlace = useCallback((dayId, name) => {
        const newPlace = {
            id: "place-" + Date.now(),
            name,
            description: "Description will be fetched...",
            category: "Attraction",
            imageUrl:
                "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400",
            lat: 13.35 + Math.random() * 0.05,
            lng: 74.75 + Math.random() * 0.05,
            addedBy: "You",
        };

        setTrip((prev) => ({
            ...prev,
            days: prev.days.map((d) =>
                d.id === dayId ? { ...d, places: [...d.places, newPlace] } : d
            ),
        }));

        toast({
            title: "Place added",
            description: `${name} was added to Day ${dayId}.`,
        });
    }, []);

    /* -----------------------------------
       EDIT MODE TOGGLE
    ----------------------------------- */
    const handleToggleEditMode = () => {
        if (!isEditMode) setOriginalTrip(trip);
        setIsEditMode(!isEditMode);
    };

    /* -----------------------------------
       SAVE = run ILP (later)
    ----------------------------------- */
    const handleSave = () => {
        setIsEditMode(false);
        toast({
            title: "Changes saved",
            description: "Your itinerary has been optimized.",
        });
    };

    /* -----------------------------------
       CANCEL = revert back
    ----------------------------------- */
    const handleCancel = () => {
        setTrip(originalTrip);
        setIsEditMode(false);
        toast({
            title: "Changes discarded",
            description: "All modifications were reverted.",
        });
    };

    /* -----------------------------------
       DAY SWITCH (from MapPanel)
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
                <div className="w-[40%] min-w-[360px] border-r border-gray-200 bg-white">
                    {/* Left section */}
                    
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
                        isEditMode={isEditMode}
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
