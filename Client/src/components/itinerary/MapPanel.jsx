import { useEffect, useRef, useState} from "react";
import { OlaMaps } from "olamaps-web-sdk";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const OLA_API_KEY = "CornDpxoVHMISlbCN8ePrPdauyrHDeIBZotfvRdy";


export default function MapPanel({
  places,
  selectedPlace,
  onSelectPlace,
  currentDayIndex,
  totalDays,
  onNavigateDay,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const olaMapsRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  /* ------------------ INIT MAP ------------------ */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      olaMapsRef.current = new OlaMaps({ apiKey: OLA_API_KEY });

      mapRef.current = olaMapsRef.current.init({
        container: mapContainerRef.current,
        style:
          "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
        center: [72.87, 19.07], // Mumbai
        zoom: 11,
      });

      const navControl = olaMapsRef.current.addNavigationControls({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      });

      mapRef.current.addControl(navControl, "top-right");

      mapRef.current.on("load", () => setMapLoaded(true));
    } catch (err) {
      console.error("Ola Maps init error:", err);
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  /* ------------------ MARKERS ------------------ */
  useEffect(() => {
    if (!mapRef.current || !olaMapsRef.current || !mapLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const visiblePlaces = places.filter((p) => p.id !== "LUNCH_BREAK");

    visiblePlaces.forEach((place, index) => {
      const el = document.createElement("div");
      el.innerHTML = `
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg cursor-pointer transition-transform hover:scale-110 ${
          selectedPlace?.id === place.id
            ? "bg-[hsl(24,95%,53%)] text-white scale-125"
            : "bg-[hsl(174,72%,40%)] text-white"
        }">
          ${index + 1}
        </div>
      `;

      el.addEventListener("click", () => onSelectPlace(place));

      const marker = olaMapsRef.current
        .addMarker({ element: el, anchor: "center" })
        .setLngLat([place.longitude, place.latitude])
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });

    if (visiblePlaces.length > 0) {
      const bounds = visiblePlaces.reduce(
        (acc, p) => [
          [
            Math.min(acc[0][0], p.longitude),
            Math.min(acc[0][1], p.latitude),
          ],
          [
            Math.max(acc[1][0], p.longitude),
            Math.max(acc[1][1], p.latitude),
          ],
        ],
        [[Infinity, Infinity], [-Infinity, -Infinity]]
      );

      mapRef.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 200, left: 50, right: 50 },
        maxZoom: 14,
      });
    }
  }, [places, selectedPlace, mapLoaded, onSelectPlace]);

  /* ------------------ FLY TO PLACE ------------------ */
  useEffect(() => {
    if (!mapRef.current || !selectedPlace || !mapLoaded) return;

    mapRef.current.flyTo({
      center: [selectedPlace.longitude, selectedPlace.latitude],
      zoom: 14,
      duration: 1000,
    });
  }, [selectedPlace, mapLoaded]);

  /* ------------------ UI ------------------ */
  return (
    <div className="h-full flex flex-col bg-muted/30 relative">
      <div ref={mapContainerRef} className="flex-1 relative" />

      {/* ---------- Day Navigation ---------- */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <button
          onClick={() => onNavigateDay("prev")}
          disabled={currentDayIndex === 0}
          className="p-2 bg-white rounded-lg shadow-md disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="px-4 py-2 bg-white rounded-lg shadow-md text-sm font-medium">
          Day {currentDayIndex + 1} of {totalDays}
        </div>

        <button
          onClick={() => onNavigateDay("next")}
          disabled={currentDayIndex === totalDays - 1}
          className="p-2 bg-white rounded-lg shadow-md disabled:opacity-50"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
