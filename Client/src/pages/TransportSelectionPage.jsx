import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TransportComparison from "../components/TransportComparison";
import {
    getTransportOptions,
    postUpTransportChoice,
    postDownTransportChoice,
} from "../services/tripService";

export default function TransportSelectionPage() {
    const { tripId } = useParams();
    const navigate = useNavigate();

    const [stage, setStage] = useState("arrival");
    const [options, setOptions] = useState([]);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        loadOptions("a");
    }, []);

    const normalize = (items, type, idKey, nameKey) =>
        items.map((i) => ({
            // ===== existing fields (DO NOT REMOVE) =====
            id: i[idKey],
            name: i[nameKey],
            departure: i.departure_time,
            arrival: i.arrival_time,
            duration: i.duration,
            price: i.price,
            type,

            // ===== NEW fields for richer card =====
            departure_date: i.departure_date,
            arrival_date: i.arrival_date,
            source_station: i.source_station,
            destination_station: i.destination_station,
            available_seats: i.available_seats,
            distance: i.distance,

            // optional but useful
            code: i[idKey],
        }));

    const loadOptions = async (a_d) => {
        const data = await getTransportOptions({ trip_id: tripId, a_d });
        setOptions([
            ...normalize(data.bus, "bus", "bus_id", "bus_name"),
            ...normalize(data.train, "train", "train_id", "train_name"),
            ...normalize(data.flight, "flight", "flight_id", "flight_name"),
        ]);
    };

    const handleNext = async () => {
        if (!selected) {
            alert("Please select a transport option");
            return;
        }

        if (stage === "arrival") {
            await postUpTransportChoice({
                trip_id: tripId,
                up_mode: selected.type,
                up_mode_id: selected.id,
            });
            setStage("departure");
            setSelected(null);
            loadOptions("d");
        } else {
            await postDownTransportChoice({
                trip_id: tripId,
                down_mode: selected.type,
                down_mode_id: selected.id,
            });
            navigate(`/accommodation-option/${tripId}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
            <h1 className="text-3xl font-bold text-center mb-8">
                Select {stage === "arrival" ? "Arrival" : "Departure"} Transport
            </h1>

            <TransportComparison
                options={options}
                selected={selected}
                onSelect={setSelected}
            />

            <div className="flex justify-end mt-10">
                <button
                    onClick={handleNext}
                    className="px-8 py-3 rounded-lg text-white font-semibold
          bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 transition"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
