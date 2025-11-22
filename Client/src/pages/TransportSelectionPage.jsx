import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TransportCard from "../components/TransportCard";
import {
  updateTransport,
  getTransportOptions,
  postTransportChoice,
} from "../services/tripService";

// Example static city list
const CITY_LIST = [
  "Bengaluru",
  "Mysuru",
  "Hyderabad",
  "Chennai",
  "Mumbai",
  "Delhi",
  "Pune",
  "Kolkata",
  "Goa",
  "Jaipur",
];

export default function TransportSelectionPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [meta, setMeta] = useState({
    a_d: "d",
    from: "",
    to: "",
    date: "",
    transport_type: "mid",
  });

  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");
  const [fromList, setFromList] = useState([]);
  const [toList, setToList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({ flight: [], train: [], bus: [] });
  const [selected, setSelected] = useState(null);
  const [fetchingOptions, setFetchingOptions] = useState(false);

  // Autocomplete
  const filterCities = (text) =>
    text ? CITY_LIST.filter((c) => c.toLowerCase().includes(text.toLowerCase())) : [];

  useEffect(() => setFromList(filterCities(fromSearch)), [fromSearch]);
  useEffect(() => setToList(filterCities(toSearch)), [toSearch]);

  // Search API handler
  const handleMetaNext = async () => {
    if (!meta.from || !meta.to || !meta.date)
      return alert("Please fill all fields");

    setLoading(true);
    try {
      // convert mid/low/high → Budget Literal
      const budgetMap = {
        low: "Basic",
        mid: "Standard",
        high: "Premium",
      };

      await updateTransport({
        trip_id: tripId,
        needs_transport: true,
        transport_type: budgetMap[meta.transport_type],
      });

      setFetchingOptions(true);

      const res = await getTransportOptions({
        trip_id: tripId,
        a_d: meta.a_d, // backend expects a_d not a-d
      });

      setOptions({
        flight: res.flight || [],
        train: res.train || [],
        bus: res.bus || [],
      });
    } catch (err) {
      console.error(err);
      alert("Failed to fetch options");
    } finally {
      setLoading(false);
      setFetchingOptions(false);
    }
  };

  // Confirm transport selection
  const handleConfirm = async () => {
    if (!selected) return alert("Please select one option");

    try {
      await postTransportChoice({
        trip_id: tripId,
        mode: selected.type,
        mode_id:
          selected.flight_id ||
          selected.train_id ||
          selected.bus_id ||
          selected.id,
      });

      navigate(`/trip/${tripId}/accommodation`);
    } catch (err) {
      console.error(err);
      alert("Failed to save choice");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-white drop-shadow-md">
            🚆 Transport Selection
          </h1>
          <p className="text-white/90 text-lg mt-2">
            Choose the best travel option for your journey.
          </p>
        </div>

        {/* SEARCH FORM */}
        <div className="bg-white/20 backdrop-blur-xl border border-white/30 shadow-xl rounded-xl p-8">
          <div className="grid sm:grid-cols-2 gap-6">

            {/* Direction */}
            <div className="flex flex-col">
              <label className="text-white text-sm mb-1">Direction</label>
              <select
                value={meta.a_d}
                onChange={(e) => setMeta({ ...meta, a_d: e.target.value })}
                className="bg-white/80 rounded-lg px-3 py-2 shadow"
              >
                <option value="d">Departure</option>
                <option value="a">Arrival</option>
              </select>
            </div>

            {/* FROM */}
            <div className="relative">
              <label className="text-white text-sm mb-1">From</label>
              <input
                value={fromSearch}
                onChange={(e) => {
                  setFromSearch(e.target.value);
                  setMeta({ ...meta, from: e.target.value });
                }}
                className="bg-white/80 px-3 py-2 rounded-lg w-full shadow"
                placeholder="Type city name"
              />

              {fromList.length > 0 && (
                <div className="absolute bg-white shadow-lg rounded-lg w-full max-h-40 overflow-auto mt-1 z-20">
                  {fromList.map((c) => (
                    <div
                      key={c}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setFromSearch(c);
                        setMeta({ ...meta, from: c });
                        setFromList([]);
                      }}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TO */}
            <div className="relative">
              <label className="text-white text-sm mb-1">To</label>
              <input
                value={toSearch}
                onChange={(e) => {
                  setToSearch(e.target.value);
                  setMeta({ ...meta, to: e.target.value });
                }}
                className="bg-white/80 px-3 py-2 rounded-lg shadow w-full"
                placeholder="Type city name"
              />

              {toList.length > 0 && (
                <div className="absolute bg-white shadow-lg rounded-lg w-full max-h-40 overflow-auto mt-1 z-20">
                  {toList.map((c) => (
                    <div
                      key={c}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setToSearch(c);
                        setMeta({ ...meta, to: c });
                        setToList([]);
                      }}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DATE */}
            <div className="flex flex-col">
              <label className="text-white text-sm mb-1">Date</label>
              <input
                type="date"
                value={meta.date}
                onChange={(e) => setMeta({ ...meta, date: e.target.value })}
                className="bg-white/80 px-3 py-2 rounded-lg shadow"
              />
            </div>

            {/* Transport Budget */}
            <div className="flex flex-col">
              <label className="text-white text-sm mb-1">Transport Budget</label>
              <select
                value={meta.transport_type}
                onChange={(e) =>
                  setMeta({ ...meta, transport_type: e.target.value })
                }
                className="bg-white/80 px-3 py-2 rounded-lg shadow"
              >
                <option value="low">Low Budget</option>
                <option value="mid">Medium Budget</option>
                <option value="high">High Budget</option>
              </select>
            </div>
          </div>

          {/* SEARCH BUTTON */}
          <div className="flex justify-end mt-6">
            <button
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg shadow"
              onClick={handleMetaNext}
              disabled={loading}
            >
              {loading ? "Searching..." : "Search Options"}
            </button>
          </div>
        </div>

        {/* RESULTS */}
        <div className="mt-10 text-white">
          {fetchingOptions ? (
            <div className="text-center py-10 text-xl">Fetching options...</div>
          ) : (
            <>
              {/* FLIGHTS */}
              <h2 className="text-xl font-bold mt-6 mb-2">Flights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {options.flight.map((opt) => (
                  <TransportCard
                    key={opt.flight_id}
                    option={{ ...opt, type: "flight" }}
                    selected={selected?.flight_id === opt.flight_id}
                    onSelect={(o) => setSelected(o)}
                  />
                ))}
                {options.flight.length === 0 && <p>No flights found.</p>}
              </div>

              {/* TRAINS */}
              <h2 className="text-xl font-bold mt-6 mb-2">Trains</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {options.train.map((opt) => (
                  <TransportCard
                    key={opt.train_id}
                    option={{ ...opt, type: "train" }}
                    selected={selected?.train_id === opt.train_id}
                    onSelect={(o) => setSelected(o)}
                  />
                ))}
                {options.train.length === 0 && <p>No trains found.</p>}
              </div>

              {/* BUSES */}
              <h2 className="text-xl font-bold mt-6 mb-2">Buses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {options.bus.map((opt) => (
                  <TransportCard
                    key={opt.bus_id}
                    option={{ ...opt, type: "bus" }}
                    selected={selected?.bus_id === opt.bus_id}
                    onSelect={(o) => setSelected(o)}
                  />
                ))}
                {options.bus.length === 0 && <p>No buses found.</p>}
              </div>

              {/* CONFIRM */}
              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 bg-white/30 text-white rounded-lg"
                >
                  Back
                </button>

                <button
                  onClick={handleConfirm}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
                >
                  Confirm & Continue
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
