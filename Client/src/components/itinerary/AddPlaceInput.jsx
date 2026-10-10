import { useState, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";

export function AddPlaceInput({ onAdd }) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const API_KEY = "CornDpxoVHMISlbCN8ePrPdauyrHDeIBZotfvRdy";

  /* ---------------------------------------------------
      1️⃣ AUTOCOMPLETE (OLA MAPS)
  --------------------------------------------------- */
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        setLoading(true);

        const url =
          `https://api.olamaps.io/places/v1/autocomplete?` +
          `input=${encodeURIComponent(value)}` +
          `&language=en&api_key=${API_KEY}`;

        const res = await fetch(url);
        const data = await res.json();

        setSuggestions(data.predictions || []);
      } catch (err) {
        console.error("OLA Autocomplete Error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [value]);

  /* ---------------------------------------------------
      2️⃣ HANDLE SELECTION FROM DROPDOWN
  --------------------------------------------------- */
  const handleSelect = async (prediction) => {
    setValue("");
    setSuggestions([]);
    setLoadingDetails(true);

    try {
      /* ---------------------------------------------------
          3️⃣ FETCH OLA PLACE DETAILS
      --------------------------------------------------- */
      const detailsURL =
        `https://api.olamaps.io/places/v1/details?place_id=${prediction.place_id}` +
        `&language=en&api_key=${API_KEY}`;

      const res = await fetch(detailsURL);
      const details = await res.json();
      const place = details.result;

      let description = "";
      let imageUrl = null;

      /* ---------------------------------------------------
          4️⃣ WIKIPEDIA LOOKUP (Backup description + image)
      --------------------------------------------------- */
      const placeName = place.name;

      // Step A: Search Wikidata for matching entity
      const wikiSearchRes = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
          placeName
        )}&language=en&format=json&origin=*`
      );

      const wikiSearch = await wikiSearchRes.json();

      if (wikiSearch.search && wikiSearch.search.length > 0) {
        const entityId = wikiSearch.search[0].id;

        // Step B: Fetch entity details → get actual Wikipedia title
        const entityRes = await fetch(
          `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`
        );
        const entityData = await entityRes.json();

        const wikiTitle =
          entityData.entities?.[entityId]?.sitelinks?.enwiki?.title;

        if (wikiTitle) {
          // Step C: Fetch Wikipedia summary via REST API
          const summaryRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`
          );
          const summaryData = await summaryRes.json();

          description = summaryData.extract || "";
          imageUrl = summaryData.thumbnail?.source || null;
        }
      }

      /* ---------------------------------------------------
          FINAL FALLBACKS
      --------------------------------------------------- */

      if (!description)
        description =
          place.description ||
          place.formatted_address ||
          "No description available.";

      if (!imageUrl && place.photos?.length > 0) {
        imageUrl = place.photos[0].photo_url;
      }

      /* ---------------------------------------------------
          5️⃣ RETURN A CLEAN NEW PLACE OBJECT
      --------------------------------------------------- */
      const newPlace = {
        id: place.place_id,
        name: place.name,
        description,
        lat: place.geometry?.location?.lat || null,
        lng: place.geometry?.location?.lng || null,
        imageUrl,
        addedBy: "You",
      };

      onAdd?.(newPlace);
    } catch (err) {
      console.error("Place details/wikipedia error:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  /* ---------------------------------------------------
      UI COMPONENT
  --------------------------------------------------- */
  return (
    <div className="relative w-full">
      {/* Input Box */}
      <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl border border-gray-300">
        <MapPin className="w-4 h-4 text-gray-500" />

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search for a place"
          className="flex-1 bg-transparent outline-none text-gray-800"
        />

        {(loading || loadingDetails) && (
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        )}
      </div>

      {/* Dropdown */}
      {suggestions.length > 0 && (
        <div
          className="
            absolute left-0 right-0 top-full mt-2 z-30
            bg-white border border-gray-300 rounded-xl shadow-xl
            max-h-64 overflow-y-auto
          "
        >
          {suggestions.map((s) => (
            <div
              key={s.place_id}
              onClick={() => handleSelect(s)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
            >
              <p className="font-medium text-gray-900">
                {s.structured_formatting.main_text}
              </p>
              <p className="text-sm text-gray-600">
                {s.structured_formatting.secondary_text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
