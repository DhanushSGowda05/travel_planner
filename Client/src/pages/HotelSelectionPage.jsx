import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";

import {
  MapPin,
  Search,
  ArrowLeft,
  Check,
  ChevronRight
} from "lucide-react";
import { getHotelOptions, chooseHotel } from "../services/tripService";

export default function HotelSelectionPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHotels() {
      try {
        const res = await getHotelOptions({ trip_id: tripId });
        setHotels(res.hotels || []);
      } catch (err) {
        setError("Failed to load hotels");
      } finally {
        setLoading(false);
      }
    }
    fetchHotels();
  }, [tripId]);

  const filteredHotels = hotels.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContinue = async () => {
    if (!selectedHotel) {
      alert("Please select a hotel");
      return;
    }

    await chooseHotel({
      trip_id: tripId,
      hotel_name: selectedHotel.name,
      hotel_address: selectedHotel.address,
      hotel_lat: selectedHotel.lat,
      hotel_long: selectedHotel.long,
      hotel_price: selectedHotel.price
    });

    navigate(`/trip-itinerary/${tripId}`);
  };

  if (loading) return <p className="p-6">Loading hotels...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="text-center flex-1">
              <h1 className="text-3xl">Select Your Hotel</h1>
              <p className="text-gray-600 text-sm mt-1">
                {filteredHotels.length} hotels available
              </p>
            </div>

            <div className="w-24" />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search hotels by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 border-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Hotel Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8 pb-24">
        {filteredHotels.length === 0 ? (
          <p className="text-center text-gray-500">No hotels found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHotels.map((hotel) => (
              <Card
                key={hotel.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedHotel?.id === hotel.id
                    ? "ring-4 ring-teal-500 shadow-xl"
                    : "border-2 border-gray-200 hover:shadow-lg"
                }`}
                onClick={() => setSelectedHotel(hotel)}
              >
                <CardContent className="p-5 flex flex-col h-full">
                  <h3 className="text-xl mb-2">{hotel.name}</h3>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-2">{hotel.address}</span>
                  </div>

                  <div className="mt-auto flex justify-between items-end pt-4 border-t">
                    <div>
                      <p className="text-2xl text-teal-600">
                        {hotel.currency} {hotel.price}
                      </p>
                      <p className="text-xs text-gray-500">per night</p>
                    </div>

                    <Button
                      size="sm"
                      variant={selectedHotel?.id === hotel.id ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHotel(hotel);
                      }}
                      className={
                        selectedHotel?.id === hotel.id
                          ? "bg-teal-500 hover:bg-teal-600"
                          : ""
                      }
                    >
                      {selectedHotel?.id === hotel.id ? "Selected" : "Select"}
                    </Button>
                  </div>

                  {selectedHotel?.id === hotel.id && (
                    <Badge className="absolute top-3 right-3 bg-teal-500 text-white">
                      <Check className="w-3 h-3 mr-1" />
                      Selected
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      {selectedHotel && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Selected Hotel</p>
              <p className="font-medium">{selectedHotel.name}</p>
            </div>
            <Button
              size="lg"
              onClick={handleContinue}
              className="bg-gradient-to-r from-teal-500 to-teal-600"
            >
              Continue
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
