
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createTrip, interpretTripPreferences } from "../services/tripService";
// Static options — declared outside the component
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

export default function TripFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tripDescription, setTripDescription] = useState("");
  const [interpreting, setInterpreting] = useState(false);
  const [interpretError, setInterpretError] = useState("");
  const [interpretSuccess, setInterpretSuccess] = useState("");

  const [budgetMode, setBudgetMode] = useState("type");

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


  const handleInterpretPreferences = async () => {
    if (!tripDescription.trim()) {
      setInterpretError("Describe your trip first.");
      setInterpretSuccess("");
      return;
    }

    setInterpreting(true);
    setInterpretError("");
    setInterpretSuccess("");

    try {
      const result = await interpretTripPreferences(tripDescription);

      const preferences = (result.preferences || []).map((p) =>
        p === "museums" ? "museum" : p
      );

      const dislikes = (result.dislikes || []).map((p) =>
        p === "museums" ? "museum" : p
      );

      const paceMap = {
        Relaxed: "low",
        Moderate: "mid",
        "Fast-Paced": "high",
      };

      const hasBudgetAmount =
        result.budget_amount !== null &&
        result.budget_amount !== undefined;

      setForm((prev) => ({
        ...prev,
        origin_city: result.origin_city || prev.origin_city,
        destination_city:
          result.destination_city || prev.destination_city,
        start_date: result.start_date || prev.start_date,
        end_date: result.end_date || prev.end_date,
        budget_type: result.budget_type || "",
        budget_amount: hasBudgetAmount
          ? String(result.budget_amount)
          : "",
        num_people: result.num_people ?? prev.num_people,
        preferences,
        dislikes,
        mandatory_places: (result.mandatory_places || []).join(", "),
        food_preference:
          result.food_preference || prev.food_preference,
        pace: paceMap[result.pace] || prev.pace,
      }));

      setBudgetMode(hasBudgetAmount ? "amount" : "type");
      setInterpretSuccess(
        "Preferences interpreted. Review and edit the fields below before continuing."
      );
    } catch (err) {
      setInterpretError(
        err.message || "Could not interpret your trip description."
      );
    } finally {
      setInterpreting(false);
    }
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

        {/* AI TRIP PREFERENCE INTERPRETER */}
        <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              ✨ Plan with AI
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Describe your ideal trip in your own words. AI will fill in
              the form for you to review.
            </p>
          </div>

          <textarea
            value={tripDescription}
            onChange={(e) => {
              setTripDescription(e.target.value);
              setInterpretError("");
              setInterpretSuccess("");
            }}
            maxLength={4000}
            rows={4}
            placeholder="Example: I'm planning a 3-day trip from Bangalore to Mysore for 2 people. I love history, palaces and museums, prefer vegetarian food, want a relaxed pace, and would like to visit Mysore Palace."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              {tripDescription.length}/4000 characters
            </span>

            <button
              type="button"
              onClick={handleInterpretPreferences}
              disabled={interpreting || !tripDescription.trim()}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {interpreting ? "Interpreting..." : "✨ Interpret with AI"}
            </button>
          </div>

          {interpretError && (
            <p role="alert" className="text-sm text-red-600">
              {interpretError}
            </p>
          )}

          {interpretSuccess && (
            <p role="status" className="text-sm text-green-700">
              ✓ {interpretSuccess}
            </p>
          )}
        </section>

        <hr className="border-slate-200" />

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
