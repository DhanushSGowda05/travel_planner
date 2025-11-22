import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AccommodationCard from "../components/AccommodationCard";
import { updateAccommodation, postHotelChoice } from "../services/tripService";

export default function AccommodationSelectionPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [meta, setMeta] = useState({
    accommodation_type: "mid",
    ac_loc: "",
  });

  const [options, setOptions] = useState([
    // local UI mock until you call a real endpoint to fetch hotels
    {
      accId: "H001",
      provider: "Sea Breeze Resort",
      pricePerNight: 4000,
      totalPrice: 12000,
      rating: 4.5,
      thumbnail: null,
    },
    {
      accId: "H002",
      provider: "The Imperial Hotel",
      pricePerNight: 7000,
      totalPrice: 21000,
      rating: 4.8,
      thumbnail: null,
    },
  ]);

  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleMetaNext = async () => {
    try {
      await updateAccommodation({
        trip_id: tripId,
        needs_accommodation: "yes",
        accommodation_type: meta.accommodation_type,
        ac_loc: meta.ac_loc,
      });
      // In future call backend to fetch real options; for now we use `options` mock
      // e.g. fetch(`${BASE}/accommodation-options`, ...)
    } catch (err) {
      console.error(err);
      alert("Failed to update accommodation settings");
    }
  };

  const handleConfirm = async () => {
    if (!selected) return alert("Select one hotel");
    setSaving(true);
    try {
      await postHotelChoice({
        trip_id: tripId,
        hotel_id: selected.accId || selected.id,
      });
      navigate(`/trip/${tripId}/summary`);
    } catch (err) {
      console.error(err);
      alert("Failed to save hotel choice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Accommodation Selection</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="grid sm:grid-cols-2 gap-3">
          <select
            value={meta.accommodation_type}
            onChange={(e) => setMeta((s) => ({ ...s, accommodation_type: e.target.value }))}
            className="border px-3 py-2 rounded"
          >
            <option value="luxury">Luxury</option>
            <option value="mid">Mid-range</option>
            <option value="budget">Budget</option>
          </select>

          <input
            placeholder="Search location (optional)"
            value={meta.ac_loc}
            onChange={(e) => setMeta((s) => ({ ...s, ac_loc: e.target.value }))}
            className="border px-3 py-2 rounded"
          />
        </div>

        <div className="flex justify-end mt-4">
          <button onClick={handleMetaNext} className="px-4 py-2 bg-cyan-600 text-white rounded">Show options</button>
        </div>
      </div>

      <section>
        <div className="grid md:grid-cols-2 gap-3">
          {options.map((opt) => (
            <AccommodationCard
              key={opt.accId}
              option={opt}
              selected={selected && (selected.accId || selected.id) === opt.accId}
              onSelect={(o) => setSelected(o)}
            />
          ))}
        </div>

        <div className="flex justify-between items-center mt-6">
          <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded">Back</button>
          <button onClick={handleConfirm} className="px-4 py-2 bg-green-600 text-white rounded" disabled={saving}>
            {saving ? "Saving..." : "Confirm & Continue"}
          </button>
        </div>
      </section>
    </div>
  );
}
