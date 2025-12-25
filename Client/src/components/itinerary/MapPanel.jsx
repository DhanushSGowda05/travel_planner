import { useEffect, useRef } from "react";
import { OlaMaps } from "olamaps-web-sdk";

export default function MapPanel({ places, selectedPlaceId, onSelectPlace }) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const olaRef = useRef(null);
  const markersRef = useRef([]);

  const API_KEY = "CornDpxoVHMISlbCN8ePrPdauyrHDeIBZotfvRdy";

  const STYLE_URL =
    "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json";

  const selectedItem = places.find((p) => p.id === selectedPlaceId);

  /* ---------------- INIT MAP (ONCE) ---------------- */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    olaRef.current = new OlaMaps({ apiKey: API_KEY });

    mapRef.current = olaRef.current.init({
      container: mapContainerRef.current,
      style: STYLE_URL,
      center: [77.5964, 12.9752],
      zoom: 12,
    });
  }, []);

  /* ---------------- UPDATE MARKERS ---------------- */
  useEffect(() => {
    if (!mapRef.current || !olaRef.current) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    places.forEach((p, index) => {
      // ❌ Skip meals & invalid coords
      if (p.type === "meal") return;
      if (!p.lat || !p.lng) return;

      const isSelected = p.id === selectedPlaceId;

      const el = document.createElement("div");
      el.className = "custom-marker";

      const fillColor = isSelected ? "#00B050" : "#00C2C7";
      const scale = isSelected ? 1.35 : 1;

      el.innerHTML = `
        <svg width="${40 * scale}" height="${50 * scale}" 
          viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 0C9 0 0 8.5 0 19C0 32 20 50 20 50C20 50 40 32 40 19C40 8.5 31 0 20 0Z" 
            fill="${fillColor}"/>
          <text x="20" y="23" text-anchor="middle"
            font-size="16" font-weight="bold" fill="white">
            ${index + 1}
          </text>
        </svg>
      `;

      el.onclick = () => onSelectPlace(p.id);

      const marker = olaRef.current
        .addMarker({ element: el, anchor: "bottom" })
        .setLngLat([p.lng, p.lat])
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });
  }, [places, selectedPlaceId, onSelectPlace]);

  /* ---------------- CENTER MAP ON PLACE ---------------- */
  useEffect(() => {
    if (!selectedItem || selectedItem.type === "meal") return;
    if (!selectedItem.lat || !selectedItem.lng) return;

    mapRef.current?.flyTo({
      center: [selectedItem.lng, selectedItem.lat],
      zoom: 14,
      essential: true,
    });
  }, [selectedItem]);

  return (
    <>
      <style>
        {`
          .custom-marker {
            cursor: pointer;
            transform: translate(-20px, -50px);
          }
        `}
      </style>

      <div ref={mapContainerRef} className="w-full h-full relative" />

      {/* ---------------- BOTTOM POPUP ---------------- */}
      {selectedItem && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t shadow-lg rounded-t-xl p-4 z-40">

          {/* HEADER */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">
              {selectedItem.name}
            </h3>
            <button
              onClick={() => onSelectPlace(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* META */}
          <div className="text-sm text-gray-600 mb-3">
            {selectedItem.start_time}
            {selectedItem.end_time && ` – ${selectedItem.end_time}`}
          </div>

          {/* MEAL CONTENT */}
          {selectedItem.type === "meal" && (
            <>
              <p className="text-sm text-gray-700 mb-2">
                {selectedItem.description}
              </p>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedItem.restaurants?.map((r, i) => (
                  <div
                    key={i}
                    className="border rounded-lg p-2 text-sm"
                  >
                    <div className="font-medium">{r.name}</div>
                    <div className="text-gray-500 text-xs">
                      {r.address}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* PLACE CONTENT */}
          {selectedItem.type !== "meal" && (
            <p className="text-sm text-gray-700">
              {selectedItem.description || "No description available."}
            </p>
          )}
        </div>
      )}
    </>
  );
}
