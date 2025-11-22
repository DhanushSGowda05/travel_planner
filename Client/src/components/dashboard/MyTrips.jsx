import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plane, Train, Star, Trash2, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:5000";

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="text-center py-12 border border-dashed border-slate-300 rounded-2xl bg-slate-50">
      <p className="text-slate-700 mb-3 text-lg">No trips found in this category.</p>
      <Button 
      onClick={() => navigate("/trip/new")} 
      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
        ➕ Plan a Trip
      </Button>
    </div>
  );
}

export function MyTrips() {
  const [trips, setTrips] = useState([]);
  

  // Fetch trips from backend
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch(`${API_BASE}/list_trips`, {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        // Transform backend to frontend format
        const mapped = data.map((trip) => ({
          id: trip.id,
          city: trip.destination_city,
          dates: `${trip.start_date} → ${trip.end_date}`,
          startDate: trip.start_date,
          daysLeft: trip.days_left,
          status: trip.days_left >= 0 ? "upcoming" : "completed",

          // Placeholder values until you store these in DB
          budgetType: "Not specified",
          transport: "Train",
          cost: "--",
          hotel: null,
          rating: null,
        }));

        setTrips(mapped);
      } catch (error) {
        console.error("Error fetching trips:", error);
      }
    };

    fetchTrips();
  }, []);

  const upcomingTrips = trips.filter((t) => t.status === "upcoming");
  const completedTrips = trips.filter((t) => t.status === "completed");
  const savedTrips = []; // You can implement saved trips later

  const renderTrips = (list) => {
    if (list.length === 0) return <EmptyState />;

    return (
      <div className="space-y-6 mt-6">
        {list.map((trip) => (
          <Card key={trip.id} className="border border-slate-200 hover:shadow-md transition-shadow bg-white">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              
              {/* Left Section */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-cyan-600" />
                  {trip.city}
                </h3>

                <p className="text-slate-600 text-sm mt-1">
                  {trip.dates}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {trip.daysLeft >= 0
                    ? `${trip.daysLeft} days left`
                    : "Trip completed"}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <Badge className="bg-cyan-50 text-cyan-700 border-cyan-100">💰 {trip.budgetType}</Badge>

                  <Badge className="bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1">
                    {trip.transport === "Flight" ? (
                      <Plane className="h-4 w-4" />
                    ) : (
                      <Train className="h-4 w-4" />
                    )}
                    {trip.transport}
                  </Badge>

                  <Badge className="bg-slate-50 text-slate-700 border-slate-200">
                    {trip.cost}
                  </Badge>
                </div>

                {trip.hotel && (
                  <p className="text-slate-700 text-sm mt-3 flex items-center gap-1">
                    🏨 {trip.hotel}
                    <span className="text-yellow-500 flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400" /> {trip.rating}
                    </span>
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 gap-1">
                  <Eye className="h-4 w-4" /> View
                </Button>
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50 gap-1">
                  <Pencil className="h-4 w-4" /> Modify
                </Button>
                <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 gap-1">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue="upcoming" className="w-full mt-6">
      <TabsList className="flex gap-2">
        <TabsTrigger value="upcoming">Upcoming Trips</TabsTrigger>
        <TabsTrigger value="completed">Completed Trips</TabsTrigger>
        <TabsTrigger value="saved">Saved Trips</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming">{renderTrips(upcomingTrips)}</TabsContent>
      <TabsContent value="completed">{renderTrips(completedTrips)}</TabsContent>
      <TabsContent value="saved">{renderTrips(savedTrips)}</TabsContent>
    </Tabs>
  );
}

export default MyTrips;
