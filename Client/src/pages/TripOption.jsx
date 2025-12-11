import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { updateTransport, getTransportOptions } from "../services/tripService";

export default function TripOptionPage() {
    const navigate = useNavigate();
    const { tripId } = useParams();

    const [needsTransport, setNeedsTransport] = useState(null);
    const [transportType, setTransportType] = useState("Economy");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (needsTransport === null) {
            alert("Please select if you need transport.");
            return;
        }

        setLoading(true);

        try {
            // STEP 1 → update basic transport settings
            const payload = {
                trip_id: tripId,
                needs_transport: needsTransport,
                transport_type: needsTransport ? transportType : null,
            };

            await updateTransport(payload);

            // If user does NOT need transport → skip to accommodation
            if (!needsTransport) {
                navigate(`/accommodation-option/${tripId}`);
                return;
            }

            // STEP 2 → Get ARRIVAL transport options (backend expects "a")
            const arrivalPayload = {
                trip_id: tripId,
                a_d: "a"       // ⭐ FIXED
            };

            const arrivalData = await getTransportOptions(arrivalPayload);

            // STEP 3 → Navigate to transport selection with arrival results
            navigate(`/transport-selection/${tripId}`, {
                state: {
                    stage: "arrival",
                    results: arrivalData
                }
            });

        } catch (err) {
            console.error(err);
            alert("Failed to update transport option");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow">
            <h1 className="text-3xl font-bold text-slate-900 mb-6 text-center">
                Transport Options
            </h1>

            {/* NEED TRANSPORT SECTION */}
            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                    🚗 Do you need transport?
                </h2>

                <div className="flex gap-6 mt-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="needsTransport"
                            checked={needsTransport === true}
                            onChange={() => setNeedsTransport(true)}
                            className="h-4 w-4"
                        />
                        <span className="text-slate-800">Yes</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="needsTransport"
                            checked={needsTransport === false}
                            onChange={() => setNeedsTransport(false)}
                            className="h-4 w-4"
                        />
                        <span className="text-slate-800">No</span>
                    </label>
                </div>

                {/* TRANSPORT TYPE SELECTION */}
                {needsTransport === true && (
                    <div className="mt-6">
                        <h3 className="text-lg font-medium text-slate-900 mb-2">
                            Select Transport Type
                        </h3>
                        <select
                            value={transportType}
                            onChange={(e) => setTransportType(e.target.value)}
                            className="border border-slate-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="Basic">Basic</option>
                            <option value="Economy">Economy</option>
                            <option value="Standard">Standard</option>
                            <option value="Premium">Premium</option>
                            <option value="Luxury">Luxury</option>
                        </select>
                    </div>
                )}
            </div>

            {/* BUTTON */}
            <div className="flex justify-end mt-8">
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-cyan-600 text-white px-6 py-2 rounded-lg text-lg shadow hover:bg-cyan-700 transition disabled:opacity-60"
                >
                    {loading ? "Saving..." : "Next →"}
                </button>
            </div>
        </div>
    );
}
