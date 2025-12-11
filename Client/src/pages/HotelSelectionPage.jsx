import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { postHotelChoice } from "../services/tripService";

export default function HotelSelectionPage() {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const accommodationType = location.state?.accommodation_type;
    const accLoc = location.state?.acc_loc;

    const [hotels, setHotels] = useState([]);
    const [selectedHotel, setSelectedHotel] = useState(null);

    // Simulate backend fetch
    useEffect(() => {
        fetchHotels();
    }, []);

    const fetchHotels = async () => {
        // Replace this with real API when backend ready
        const dummyHotels = [
            {
                hotel_id: "HT-1001",
                hotel_name: "Ocean View Resort",
                rating: 4.4,
                price_per_night: 2200,
                location: "Near Panambur Beach",
                amenities: ["WiFi", "Breakfast", "Pool"],
                distance_from_center_km: 2.5,
                type: "Premium"
            },
            {
                hotel_id: "HT-1002",
                hotel_name: "City Comfort Inn",
                rating: 4.0,
                price_per_night: 1500,
                location: "City Center",
                amenities: ["WiFi", "Parking"],
                distance_from_center_km: 0.8,
                type: "Standard"
            },
            {
                hotel_id: "HT-1003",
                hotel_name: "Luxury Palace Hotel",
                rating: 4.7,
                price_per_night: 3800,
                location: "Kadri Hills",
                amenities: ["WiFi", "Spa", "Gym"],
                distance_from_center_km: 3.1,
                type: "Luxury"
            }
        ];

        // Filter by accommodationType
        setHotels(dummyHotels.filter(h => h.type === accommodationType));
    };

    const handleNext = async () => {
        if (!selectedHotel) {
            alert("Please select a hotel.");
            return;
        }

        try {
            await postHotelChoice({
                trip_id: tripId,
                hotel_id: selectedHotel
            });

            navigate(`/itinerary/${tripId}`);

        } catch (err) {
            console.error(err);
            alert("Failed to save hotel choice");
        }
    };

    const HotelCard = ({ hotel }) => {
        const isSelected = selectedHotel === hotel.hotel_id;

        return (
            <div
                onClick={() => setSelectedHotel(hotel.hotel_id)}
                className={`p-4 border rounded-lg cursor-pointer shadow-sm transition 
                    ${isSelected ? "border-cyan-600 bg-cyan-50" : "border-slate-300 bg-white"}`}
            >
                <h3 className="text-xl font-semibold">{hotel.hotel_name}</h3>
                <p className="text-slate-700">⭐ {hotel.rating}</p>
                <p className="text-slate-700">
                    <strong>Price:</strong> ₹{hotel.price_per_night} / night
                </p>
                <p className="text-slate-700">
                    <strong>Location:</strong> {hotel.location}
                </p>
                <p className="text-slate-700">
                    <strong>Amenities:</strong> {hotel.amenities.join(", ")}
                </p>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow">

            <h1 className="text-3xl font-bold text-center mb-6">
                Select Your Hotel
            </h1>

            {/* HOTEL CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                {hotels.map(hotel => (
                    <HotelCard key={hotel.hotel_id} hotel={hotel} />
                ))}
            </div>

            <div className="flex justify-end mt-10">
                <button
                    onClick={handleNext}
                    className="bg-cyan-600 text-white px-6 py-2 rounded-lg text-lg shadow hover:bg-cyan-700 transition"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
