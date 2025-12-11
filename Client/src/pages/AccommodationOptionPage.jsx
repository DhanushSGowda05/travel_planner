import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { updateAccommodation } from "../services/tripService";

export default function AccommodationOptionPage() {
    const { tripId } = useParams();
    const navigate = useNavigate();

    const [needsAccommodation, setNeedsAccommodation] = useState(null);
    const [accommodationType, setAccommodationType] = useState("Basic");
    const [accLoc, setAccLoc] = useState("");
    const [loading, setLoading] = useState(false);

    const handleNext = async () => {
        if (needsAccommodation === null) {
            alert("Please select whether you need accommodation.");
            return;
        }

        setLoading(true);
        try {
            await updateAccommodation({
                trip_id: tripId,
                needs_accommodation: needsAccommodation,
                accommodation_type: needsAccommodation ? accommodationType : null,
                acc_loc: needsAccommodation ? accLoc : null
            });

            if (needsAccommodation) {
                navigate(`/hotel-selection/${tripId}`, {
                    state: { accommodation_type: accommodationType, acc_loc: accLoc }
                });
            } else {
                navigate(`/trip-itinerary/${tripId}`);
            }

        } catch (err) {
            console.error(err);
            alert("Failed to update accommodation details");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow">
            <h1 className="text-3xl font-bold text-slate-900 mb-6 text-center">
                Accommodation Options
            </h1>

            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">

                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                    🏨 Do you need accommodation?
                </h2>

                <div className="flex gap-6 mt-3">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="needs"
                            checked={needsAccommodation === true}
                            onChange={() => setNeedsAccommodation(true)}
                        />
                        <span>Yes</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="needs"
                            checked={needsAccommodation === false}
                            onChange={() => setNeedsAccommodation(false)}
                        />
                        <span>No</span>
                    </label>
                </div>

                {needsAccommodation === true && (
                    <div className="mt-6 space-y-4">

                        {/* Accommodation Type */}
                        <div>
                            <label className="text-slate-800 font-medium">
                                Select Accommodation Type
                            </label>
                            <select
                                value={accommodationType}
                                onChange={(e) => setAccommodationType(e.target.value)}
                                className="w-full mt-2 px-3 py-2 border rounded-lg"
                            >
                                <option value="Basic">Basic</option>
                                <option value="Standard">Standard</option>
                                <option value="Premium">Premium</option>
                                <option value="Luxury">Luxury</option>
                            </select>
                        </div>

                        {/* Location Preference */}
                        <div>
                            <label className="text-slate-800 font-medium">
                                Preferred Location (optional)
                            </label>
                            <input
                                value={accLoc}
                                onChange={(e) => setAccLoc(e.target.value)}
                                placeholder="e.g., Near beach, city center"
                                className="w-full mt-2 px-3 py-2 border rounded-lg"
                            />
                        </div>

                    </div>
                )}
            </div>

            <div className="flex justify-end mt-8">
                <button
                    onClick={handleNext}
                    disabled={loading}
                    className="bg-cyan-600 text-white px-6 py-2 rounded-lg text-lg shadow hover:bg-cyan-700 transition disabled:opacity-60"
                >
                    {loading ? "Saving..." : "Next →"}
                </button>
            </div>
        </div>
    );
}
