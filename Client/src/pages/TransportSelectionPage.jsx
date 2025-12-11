import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    getTransportOptions,
    postUpTransportChoice,
    postDownTransportChoice,
} from "../services/tripService";

export default function TransportSelectionPage() {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [stage, setStage] = useState("arrival"); // arrival → departure
    const [loading, setLoading] = useState(false);

    const [results, setResults] = useState({
        bus: [],
        train: [],
        flight: [],
    });

    const [selected, setSelected] = useState({
        mode: null,
        mode_id: null,
    });

    // -----------------------------
    // Load ARRIVAL options first
    // -----------------------------
    useEffect(() => {
        fetchArrival();
    }, []);

    const fetchArrival = async () => {
        setLoading(true);
        try {
            const data = await getTransportOptions({
                trip_id: tripId,
                a_d: "a",
            });
            setResults(data);
            setStage("arrival");
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------
    // Load DEPARTURE options
    // -----------------------------
    const fetchDeparture = async () => {
        setLoading(true);
        try {
            const data = await getTransportOptions({
                trip_id: tripId,
                a_d: "d",
            });
            setResults(data);
            setStage("departure");
            setSelected({ mode: null, mode_id: null });
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------
    // NEXT BUTTON LOGIC
    // -----------------------------
    const handleNext = async () => {
        if (!selected.mode) {
            alert("Please select a transport option.");
            return;
        }

        try {
            if (stage === "arrival") {
                await postUpTransportChoice({
                    trip_id: tripId,
                    up_mode: selected.mode,
                    up_mode_id: selected.mode_id,
                });

                fetchDeparture();
                return;
            }

            if (stage === "departure") {
                await postDownTransportChoice({
                    trip_id: tripId,
                    down_mode: selected.mode,
                    down_mode_id: selected.mode_id,
                });

                navigate(`/accommodation-option/${tripId}`);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to save selection");
        }
    };

    // -----------------------------
    // TRANSPORT CARD COMPONENT
    // -----------------------------
    const TransportCard = ({ item, mode }) => {
        const uniqueId =
            mode === "bus"
                ? item.bus_id
                : mode === "train"
                ? item.train_id
                : item.flight_id;

        const isSelected =
            selected.mode === mode && selected.mode_id === uniqueId;

        return (
            <div
                onClick={() => setSelected({ mode, mode_id: uniqueId })}
                className={`p-4 border rounded-lg cursor-pointer transition shadow-sm 
                ${
                    isSelected
                        ? "border-cyan-600 bg-cyan-50"
                        : "border-slate-300 bg-white"
                }`}
            >
                <h3 className="text-lg font-semibold mb-1">
                    {mode === "bus" && item.bus_name}
                    {mode === "train" && item.train_name}
                    {mode === "flight" && item.flight_name}
                </h3>

                <p className="text-slate-600">
                    <strong>Departure:</strong> {item.departure_time}
                </p>

                <p className="text-slate-600">
                    <strong>Arrival:</strong> {item.arrival_time}
                </p>

                {item.duration && (
                    <p className="text-slate-600">
                        <strong>Duration:</strong> {item.duration}
                    </p>
                )}

                <p className="text-slate-700 font-medium mt-2">
                    <strong>Price:</strong> ₹{item.price}
                </p>
            </div>
        );
    };

    // -----------------------------
    // MAIN RETURN UI
    // -----------------------------
    return (
        <div className="max-w-5xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow">
            <h1 className="text-3xl font-bold text-slate-900 text-center mb-6">
                {stage === "arrival"
                    ? "Select Arrival Transport"
                    : "Select Departure Transport"}
            </h1>

            <div className="mt-10 space-y-10">
                {/* BUS */}
                <div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">
                        🚌 Bus Options
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.bus.map((item, index) => (
                            <TransportCard
                                key={index}
                                item={item}
                                mode="bus"
                            />
                        ))}
                    </div>
                </div>

                {/* TRAIN */}
                <div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">
                        🚆 Train Options
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.train.map((item, index) => (
                            <TransportCard
                                key={index}
                                item={item}
                                mode="train"
                            />
                        ))}
                    </div>
                </div>

                {/* FLIGHT */}
                <div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">
                        ✈️ Flight Options
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.flight.map((item, index) => (
                            <TransportCard
                                key={index}
                                item={item}
                                mode="flight"
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* NEXT BUTTON */}
            <div className="flex justify-end mt-10">
                <button
                    onClick={handleNext}
                    className="bg-cyan-600 text-white px-6 py-2 rounded-lg text-lg shadow hover:bg-cyan-700 transition"
                >
                    {stage === "arrival"
                        ? "Next (Departure) →"
                        : "Next (Accommodation) →"}
                </button>
            </div>
        </div>
    );
}
