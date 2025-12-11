import { useEffect, useRef } from "react";
import { OlaMaps } from "olamaps-web-sdk";

export default function MapPanel({ places, selectedPlaceId, onSelectPlace }) {
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const olaRef = useRef(null);
    const markersRef = useRef([]);

    const API_KEY = "CornDpxoVHMISlbCN8ePrPdauyrHDeIBZotfvRdy";

    const STYLE_URL =
        `https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json`;

    /* ---------------- INIT MAP (ONCE) ---------------- */
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        olaRef.current = new OlaMaps({ apiKey: API_KEY });

        mapRef.current = olaRef.current.init({
            container: mapContainerRef.current,
            style: STYLE_URL,
            center: [74.75, 13.35],
            zoom: 11,
        });

        mapRef.current.on("load", () => {
            console.log("Map loaded");
        });
    }, []);

    /* ---------------- UPDATE MARKERS ---------------- */
    useEffect(() => {
        if (!mapRef.current || !olaRef.current) return;

        // Remove old markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        places.forEach((p, index) => {
            const isSelected = p.id === selectedPlaceId;

            const el = document.createElement("div");
            el.className = "custom-marker";

            // Colors
            const fillColor = isSelected ? "#00B050" : "#00C2C7"; // green if selected
            const scale = isSelected ? 1.35 : 1; // bigger when selected

            el.innerHTML = `
                <svg width="${40 * scale}" height="${50 * scale}" 
                    viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 0C9 0 0 8.5 0 19C0 32 20 50 20 50C20 50 40 32 40 19C40 8.5 31 0 20 0Z" 
                          fill="${fillColor}"/>
                    <text x="20" y="23" text-anchor="middle" font-size="16" font-weight="bold" fill="white">
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
    }, [places, selectedPlaceId]);


    return (
        <>
            <style>
                {`
                    .custom-marker {
                        cursor: pointer;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        transform: translate(-20px, -50px);
                    }
                `}
            </style>

            <div ref={mapContainerRef} className="w-full h-full"></div>
        </>
    );
}
