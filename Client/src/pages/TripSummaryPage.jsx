import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTrip } from "../services/tripService";

export default function TripSummaryPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getTrip(tripId);
        setTrip(data);
      } catch (err) {
        console.error(err);
        alert("Failed to load trip summary");
      } finally {
        setLoading(false);
      }
    })();
  }, [tripId]);

  if (loading) return <div className="p-6">Loading summary...</div>;
  if (!trip) return <div className="p-6">Trip not found</div>;

  // render summary (fields depend on backend shape)
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Trip Summary</h1>

      <div className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <h3 className="font-semibold">Trip</h3>
          <div className="text-slate-700">{trip.name ?? `${trip.origin_city} → ${trip.destination_city}`}</div>
          <div className="text-sm text-slate-500">
            {trip.start_date} to {trip.end_date}
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Transport</h3>
          {trip.transport_transports || trip.transport || trip.transport_choice ? (
            <pre className="text-sm bg-slate-50 p-3 rounded overflow-auto">{JSON.stringify(trip.transport_transports ?? trip.transport ?? trip.transport_choice, null, 2)}</pre>
          ) : (
            <div className="text-slate-500">No transport selected</div>
          )}
        </div>

        <div>
          <h3 className="font-semibold">Accommodation</h3>
          {trip.accommodations || trip.accommodation || trip.hotel_choice ? (
            <pre className="text-sm bg-slate-50 p-3 rounded overflow-auto">{JSON.stringify(trip.accommodations ?? trip.accommodation ?? trip.hotel_choice, null, 2)}</pre>
          ) : (
            <div className="text-slate-500">No accommodation selected</div>
          )}
        </div>

        <div className="flex justify-between mt-4">
          <button onClick={() => navigate(`/trip/${tripId}/transport`)} className="px-4 py-2 border rounded">Edit Transport</button>
          <div className="flex gap-3">
            <button onClick={() => navigate(`/trip/${tripId}/accommodation`)} className="px-4 py-2 border rounded">Edit Accommodation</button>
            <button onClick={() => navigate(`/trip/${tripId}/itinerary`)} className="px-4 py-2 bg-cyan-600 text-white rounded">Continue</button>
          </div>
        </div>
      </div>
    </div>
  );
}
