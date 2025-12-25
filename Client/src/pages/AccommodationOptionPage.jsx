import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Building2,
  Home,
  Hotel,
  Castle,
  MapPin,
  ChevronRight
} from "lucide-react";
import { updateAccommodation } from "../services/tripService";

export default function AccommodationOptionPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [needsAccommodation, setNeedsAccommodation] = useState("");
  const [accommodationType, setAccommodationType] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!needsAccommodation) {
      alert("Please select whether you need accommodation");
      return;
    }

    const payload = {
      trip_id: tripId,
      needs_accommodation: needsAccommodation === "yes",
      accommodation_type:
        needsAccommodation === "yes" ? accommodationType : null,
      acc_loc: needsAccommodation === "yes" ? location : null
    };

    if (needsAccommodation === "yes" && !accommodationType) {
      alert("Please select an accommodation type");
      return;
    }

    try {
      setLoading(true);
      await updateAccommodation(payload);

      if (needsAccommodation === "yes") {
        navigate(`/hotel-selection/${tripId}`);
      } else {
        navigate(`/transport-option/${tripId}`);
      }
    } catch (err) {
      alert("Failed to update accommodation details");
    } finally {
      setLoading(false);
    }
  };

  const accommodationTypes = [
    {
      id: "Basic",
      name: "Basic",
      description: "Budget-friendly essentials",
      icon: Home,
      color: "from-teal-500 to-teal-600"
    },
    {
      id: "Standard",
      name: "Standard",
      description: "Comfortable & reliable",
      icon: Building2,
      color: "from-blue-500 to-blue-600"
    },
    {
      id: "Premium",
      name: "Premium",
      description: "Enhanced amenities",
      icon: Hotel,
      color: "from-orange-500 to-orange-600"
    },
    {
      id: "Luxury",
      name: "Luxury",
      description: "Top-tier experience",
      icon: Castle,
      color: "from-red-500 to-red-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-3">Accommodation Options</h1>
          <p className="text-gray-600">
            Do you need a place to stay during your trip?
          </p>
        </div>

        <div className="space-y-8">
          {/* Need accommodation */}
          <div>
            <h2 className="text-sm mb-4 text-gray-900">
              Do you need accommodation?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer transition-all duration-200 border-2 ${
                  needsAccommodation === "yes"
                    ? "border-teal-500 bg-teal-50/50 shadow-lg"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
                onClick={() => setNeedsAccommodation("yes")}
              >
                <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-3">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
                      needsAccommodation === "yes"
                        ? "from-teal-500 to-teal-600"
                        : "from-teal-400 to-teal-500"
                    } flex items-center justify-center`}
                  >
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-900">Yes, I need a hotel</p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all duration-200 border-2 ${
                  needsAccommodation === "no"
                    ? "border-gray-400 bg-gray-50 shadow-lg"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
                onClick={() => setNeedsAccommodation("no")}
              >
                <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-3">
                  <div
                    className={`w-16 h-16 rounded-2xl ${
                      needsAccommodation === "no"
                        ? "bg-gray-300"
                        : "bg-gray-200"
                    } flex items-center justify-center`}
                  >
                    <Home className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-900">No, I'm all set</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Accommodation type */}
          {needsAccommodation === "yes" && (
            <>
              <div>
                <h2 className="text-sm mb-4 text-gray-900">
                  Select accommodation type
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {accommodationTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = accommodationType === type.id;

                    return (
                      <Card
                        key={type.id}
                        className={`cursor-pointer transition-all duration-200 border-2 ${
                          isSelected
                            ? "border-teal-500 bg-teal-50/50 shadow-lg"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                        }`}
                        onClick={() => setAccommodationType(type.id)}
                      >
                        <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                          <div
                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center`}
                          >
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-gray-900 mb-1">{type.name}</p>
                            <p className="text-xs text-gray-600">
                              {type.description}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Location */}
              <div>
                <h2 className="text-sm mb-4 text-gray-900">
                  Preferred location (optional)
                </h2>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="e.g., Near city center, Beachfront"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-12 py-6 text-base border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Continue */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleNext}
              disabled={loading}
              size="lg"
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Continue to Hotels
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
