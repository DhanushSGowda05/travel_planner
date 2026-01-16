import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createTrip } from "../services/tripService";

export default function TripFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // OPTIONS
  const BUDGET_TYPES = ["Basic", "Economy", "Standard", "Premium", "Luxury"];

  const PREFERENCES_LIST = [
    "history",
    "spiritual",
    "museum",
    "parks",
    "wildlife",
    "lakes",
    "adventure",
    "malls",
    "markets",
    "entertainment",
    "trekking",
    "sports",
  ];

  const [budgetMode, setBudgetMode] = useState("type"); // "type" | "amount"

  const [form, setForm] = useState({
    origin_city: "",
    destination_city: "",
    start_date: "",
    end_date: "",
    budget_type: "",
    budget_amount: "",
    num_people: 1,
    preferences: [],
    dislikes: [],
    mandatory_places: "",
    food_preference: "Any",
    pace: "mid",
  });

  /* ---------------------------
     PREFERENCES
  --------------------------- */
  const togglePreference = (pref) => {
    setForm((prev) => {
      const updatedPrefs = prev.preferences.includes(pref)
        ? prev.preferences.filter((p) => p !== pref)
        : [...prev.preferences, pref];

      // ensure no overlap with dislikes
      const updatedDislikes = prev.dislikes.filter(
        (d) => !updatedPrefs.includes(d)
      );

      return {
        ...prev,
        preferences: updatedPrefs,
        dislikes: updatedDislikes,
      };
    });
  };

  /* ---------------------------
     DISLIKES (derived options)
  --------------------------- */
  const availableDislikes = useMemo(
    () =>
      PREFERENCES_LIST.filter(
        (item) => !form.preferences.includes(item)
      ),
    [form.preferences]
  );

  const toggleDislike = (item) => {
    setForm((prev) => ({
      ...prev,
      dislikes: prev.dislikes.includes(item)
        ? prev.dislikes.filter((d) => d !== item)
        : [...prev.dislikes, item],
    }));
  };

  /* ---------------------------
     SUBMIT
  --------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        origin_city: form.origin_city,
        destination_city: form.destination_city,
        start_date: form.start_date,
        end_date: form.end_date,

        budget_type: budgetMode === "type" ? form.budget_type : null,
        budget_amount:
          budgetMode === "amount"
            ? Number(form.budget_amount)
            : null,

        num_people: Number(form.num_people),
        preferences: form.preferences,
        dislikes: form.dislikes,

        mandatory_places: form.mandatory_places
          ? form.mandatory_places.split(",").map((s) => s.trim())
          : [],

        food_preference: form.food_preference,

        pace:
          form.pace === "low"
            ? "Relaxed"
            : form.pace === "mid"
            ? "Moderate"
            : "Fast-Paced",
      };

      const data = await createTrip(payload);
      const tripId = data.trip_id ?? data.id;

      if (!tripId) throw new Error("Trip ID missing");

      navigate(`/trip-options/${tripId}`);
    } catch (err) {
      alert(err.message || "Failed to create trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 mx-auto p-6">

      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">Plan a New Trip</h1>
        <p className="text-slate-500 mt-2">
          Fill in the details and we'll help build your perfect itinerary.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-8 space-y-8 border border-slate-200"
      >

        {/* SECTION 1: DESTINATIONS */}
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">📍 Destinations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-slate-700">Origin City</label>
              <input
                required
                value={form.origin_city}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, origin_city: e.target.value }))
                }
                className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Destination City</label>
              <input
                required
                value={form.destination_city}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, destination_city: e.target.value }))
                }
                className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg"
              />
            </div>
          </div>
        </section>

        <hr className="border-slate-200" />

        {/* SECTION 2: DATES */}
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">📅 Trip Dates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-slate-700">Start Date</label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, start_date: e.target.value }))
                }
                className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">End Date</label>
              <input
                type="date"
                required
                value={form.end_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, end_date: e.target.value }))
                }
                className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg"
              />
            </div>
          </div>
        </section>

        <hr className="border-slate-200" />

        {/* SECTION 3: BUDGET + GROUP */}
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">💵 Budget & Group</h2>

          {/* Budget toggle (already visually present in your screenshot) */}
          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={budgetMode === "type"}
                onChange={() => setBudgetMode("type")}
              />
              Budget Type
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={budgetMode === "amount"}
                onChange={() => setBudgetMode("amount")}
              />
              Budget Amount
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">

            {/* Budget Type */}
            {budgetMode === "type" && (
              <div>
                <label className="text-sm font-medium text-slate-700">Budget Type</label>
                <select
                  value={form.budget_type}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, budget_type: e.target.value }))
                  }
                  className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg"
                >
                  <option value="">Select...</option>
                  {BUDGET_TYPES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Travellers */}
            <div>
              <label className="text-sm font-medium text-slate-700">Travellers</label>
              <input
                type="number"
                min={1}
                value={form.num_people}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    num_people: Number(e.target.value),
                  }))
                }
                className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg"
              />
            </div>

            {/* Budget Amount */}
            {budgetMode === "amount" && (
              <div>
                <label className="text-sm font-medium text-slate-700">Budget Amount</label>
                <input
                  type="number"
                  value={form.budget_amount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, budget_amount: e.target.value }))
                  }
                  placeholder="₹ Amount"
                  className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg"
                />
              </div>
            )}

            {/* Pace */}
            <div>
              <label className="text-sm font-medium text-slate-700">Pace</label>
              <select
                value={form.pace}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, pace: e.target.value }))
                }
                className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg"
              >
                <option value="low">Relaxed</option>
                <option value="mid">Moderate</option>
                <option value="high">Fast-Paced</option>
              </select>
            </div>
          </div>
        </section>

        <hr className="border-slate-200" />

        {/* SECTION 4: PREFERENCES */}
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">🎒 Preferences</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PREFERENCES_LIST.map((pref) => (
              <label key={pref} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.preferences.includes(pref)}
                  onChange={() => togglePreference(pref)}
                />
                <span className="capitalize">{pref}</span>
              </label>
            ))}
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium text-slate-700">Mandatory Places</label>
            <input
              value={form.mandatory_places}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, mandatory_places: e.target.value }))
              }
              className="mt-2 w-full border border-slate-300 px-3 py-2 rounded-lg"
            />
          </div>
        </section>

        <hr className="border-slate-200" />

        {/* SECTION 4.5: DISLIKES (ADDITIVE, SAME UI) */}
        {availableDislikes.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">🚫 Dislikes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableDislikes.map((item) => (
                <label key={item} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.dislikes.includes(item)}
                    onChange={() => toggleDislike(item)}
                  />
                  <span className="capitalize">{item}</span>
                </label>
              ))}
            </div>
          </section>
        )}

        <hr className="border-slate-200" />

        {/* SECTION 5: FOOD */}
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">🍽️ Food Preference</h2>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="food"
              checked={form.food_preference === "Veg-Only"}
              onChange={() =>
                setForm((prev) => ({ ...prev, food_preference: "Veg-Only" }))
              }
            />
            Veg-Only
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="food"
              checked={form.food_preference === "Any"}
              onChange={() =>
                setForm((prev) => ({ ...prev, food_preference: "Any" }))
              }
            />
            Any
          </label>
        </section>

        {/* SUBMIT */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-cyan-600 text-white px-6 py-2 rounded-lg text-lg shadow hover:bg-cyan-700 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Next →"}
          </button>
        </div>
      </form>
    </div>
  );
}
