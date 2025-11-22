import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTrip } from "../services/tripService";

export default function TripFormPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        origin_city: "",
        destination_city: "",
        start_date: "",
        end_date: "",
        budget_amount: "",
        num_people: 1,
        preferences: "",
        dislikes: "",
        mandatory_places: "",
        food_preference: "",
        pace: "mid",
        needs_transport: true,
        needs_accommodation: true,
    });

    const [loading, setLoading] = useState(false);

    const onChange = (key) => (e) =>
        setForm((s) => ({ ...s, [key]: e.target ? e.target.value : e }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                origin_city: form.origin_city,
                destination_city: form.destination_city,
                start_date: form.start_date,
                end_date: form.end_date,

                budget_type: null,
                budget_amount: form.budget_amount ? Number(form.budget_amount) : null,

                num_people: Number(form.num_people),

                preferences: form.preferences
                    ? form.preferences.split(",").map((s) => s.trim())
                    : [],

                dislikes: form.dislikes
                    ? form.dislikes.split(",").map((s) => s.trim())
                    : [],

                mandatory_places: form.mandatory_places
                    ? form.mandatory_places.split(",").map((s) => s.trim())
                    : [],

                food_preference: form.food_preference || "Any",

                pace:
                    form.pace === "low"
                        ? "Relaxed"
                        : form.pace === "mid"
                            ? "Moderate"
                            : "Fast-Paced",
            };

            const data = await createTrip(payload);

            const tripId = data.trip_id ?? data.id;
            if (!tripId) throw new Error("No trip ID returned");

            if (form.needs_transport) {
                navigate(`/trip/${tripId}/transport`);
            } else if (form.needs_accommodation) {
                navigate(`/trip/${tripId}/accommodation`);
            } else {
                navigate(`/trip/${tripId}/summary`);
            }
        } catch (err) {
            console.error(err);
            alert(err.message || "Failed to create trip");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 mx-auto p-6">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-slate-900">Plan a New Trip</h1>
                <p className="text-slate-500 mt-2">Fill in the details and we'll help build your perfect itinerary.</p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-white shadow-lg rounded-xl p-8 space-y-8 border border-slate-200"
            >
                {/* SECTION 1 */}
                <div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">📍 Destinations</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Origin City</label>
                            <input
                                required
                                value={form.origin_city}
                                onChange={onChange("origin_city")}
                                placeholder="e.g. Bengaluru"
                                className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">Destination City</label>
                            <input
                                required
                                value={form.destination_city}
                                onChange={onChange("destination_city")}
                                placeholder="e.g. Goa"
                                className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-slate-200" />

                {/* SECTION 2 */}
                <div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">📅 Trip Dates</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Start Date</label>
                            <input
                                required
                                type="date"
                                value={form.start_date}
                                onChange={onChange("start_date")}
                                className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">End Date</label>
                            <input
                                required
                                type="date"
                                value={form.end_date}
                                onChange={onChange("end_date")}
                                className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-slate-200" />

                {/* SECTION 3 */}
                <div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">💵 Budget & Group</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Travellers</label>
                            <input
                                type="number"
                                min={1}
                                value={form.num_people}
                                onChange={(e) =>
                                    setForm((s) => ({ ...s, num_people: Number(e.target.value) }))
                                }
                                className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">Pace</label>
                            <select
                                value={form.pace}
                                onChange={onChange("pace")}
                                className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="low">Relaxed</option>
                                <option value="mid">Moderate</option>
                                <option value="high">Fast-Paced</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">Budget Amount</label>
                            <input
                                value={form.budget_amount}
                                onChange={onChange("budget_amount")}
                                placeholder="₹ Amount"
                                className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-slate-200" />

                {/* SECTION 4 */}
                <div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">🎒 Preferences</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Preferences</label>
                            <textarea
                                value={form.preferences}
                                onChange={onChange("preferences")}
                                placeholder="e.g. beaches, museums, adventure"
                                className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">Dislikes</label>
                            <textarea
                                value={form.dislikes}
                                onChange={onChange("dislikes")}
                                placeholder="e.g. crowded places, long walks"
                                className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">Mandatory Places</label>
                            <input
                                value={form.mandatory_places}
                                onChange={onChange("mandatory_places")}
                                placeholder="e.g. Taj Mahal, Marine Drive"
                                className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-slate-200" />

                {/* SECTION 5 */}
                <div className="flex items-center gap-8">
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={form.needs_transport}
                            onChange={(e) =>
                                setForm((s) => ({ ...s, needs_transport: e.target.checked }))
                            }
                            className="h-4 w-4"
                        />
                        <span className="text-slate-700">Add Transport</span>
                    </label>

                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={form.needs_accommodation}
                            onChange={(e) =>
                                setForm((s) => ({ ...s, needs_accommodation: e.target.checked }))
                            }
                            className="h-4 w-4"
                        />
                        <span className="text-slate-700">Add Accommodation</span>
                    </label>
                </div>

                {/* SUBMIT */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-cyan-600 text-white px-6 py-2 rounded-lg text-lg shadow hover:bg-cyan-700 transition disabled:opacity-60"
                    >
                        {loading ? "Creating..." : "Next →"}
                    </button>
                </div>
            </form>
        </div>
    );
}
