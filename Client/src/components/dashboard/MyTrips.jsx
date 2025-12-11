import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plane, Train, Star, Trash2, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { deleteTrip } from "../../services/tripService";
import { StatsGrid } from "./StatsGrid";

const API_BASE = "http://127.0.0.1:5000";

// Helper: compute inclusive days between two dates (returns integer >= 0)
// Accepts date strings or Date objects. Returns null if invalid.
function getDaysBetween(start, end) {
  try {
    const s = start instanceof Date ? start : new Date(start);
    const e = end instanceof Date ? end : new Date(end);
    if (isNaN(s) || isNaN(e)) return null;

    // normalize to UTC midnight to avoid DST/daylight issues
    const sUtc = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
    const eUtc = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());

    const msPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.round((eUtc - sUtc) / msPerDay);

    // inclusive duration: e.g., same day => 1 day
    return diffDays >= 0 ? diffDays + 1 : null;
  } catch (err) {
    return null;
  }
}

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="text-center py-12 border border-dashed border-slate-300 rounded-2xl bg-slate-50">
      <p className="text-slate-700 mb-3 text-lg">No trips found in this category.</p>
      <Button
        onClick={() => navigate("/trip/new")}
        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
      >
        ➕ Plan a Trip
      </Button>
    </div>
  );
}

export function MyTrips() {
  const [trips, setTrips] = useState([]);
  const navigate = useNavigate();

  // DELETE TRIP
  const handleDelete = async (tripId) => {
    if (!window.confirm("Are you sure you want to delete this trip?")) return;

    try {
      await deleteTrip({ trip_id: tripId });
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete trip");
    }
  };

  // FETCH TRIPS
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch(`${API_BASE}/list_trips`, {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        const mapped = data.map((trip) => ({
          id: trip.id,
          city: trip.destination_city,
          dates: `${trip.start_date} → ${trip.end_date}`,
          // keep raw start/end for duration calculation
          startDate: trip.start_date,
          endDate: trip.end_date,
          daysLeft: trip.days_left,
          status: trip.days_left >= 0 ? "upcoming" : "completed",

          // dynamic budget fields
          budgetType: trip.budget_type || "Not specified",
          budgetAmount: trip.budget_amount || 0,

          transport: trip.transport_mode || "Train",
          cost: trip.estimated_cost || "--",

          hotel: trip.hotel_name || null,
          rating: trip.hotel_rating || null,
        }));

        setTrips(mapped);
      } catch (error) {
        console.error("Error fetching trips:", error);
      }
    };

    fetchTrips();
  }, []);

  // ======== STATS CALCULATION (fixed: avgDays uses startDate/endDate) ========
  const stats = {
    totalTrips: trips.length,
    avgDays: 0,
    totalSpent: 0,
    favoriteDestination: "-",
  };

  if (trips.length > 0) {
    // durations array (in days) using startDate and endDate
    const durations = trips
      .map((t) => {
        const days = getDaysBetween(t.startDate, t.endDate);
        return days === null ? null : days;
      })
      .filter((d) => d !== null); // remove invalid entries

    // compute average only from valid durations
    if (durations.length > 0) {
      const sum = durations.reduce((a, b) => a + b, 0);
      stats.avgDays = Math.round(sum / durations.length);
    } else {
      stats.avgDays = 0;
    }

    // total spent (existing logic)
    stats.totalSpent = trips.reduce((sum, t) => {
      const val = parseInt(t.cost);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    // favorite destination
    const freq = {};
    trips.forEach((t) => {
      freq[t.city] = (freq[t.city] || 0) + 1;
    });

    stats.favoriteDestination = Object.keys(freq).reduce((a, b) =>
      freq[a] > freq[b] ? a : b
    );
  }

  const upcomingTrips = trips.filter((t) => t.status === "upcoming");
  const completedTrips = trips.filter((t) => t.status === "completed");
  const savedTrips = [];

  // RENDER TRIP CARD LIST
  const renderTrips = (list) => {
    if (list.length === 0) return <EmptyState />;

    return (
      <div className="space-y-6 mt-6">
        {list.map((trip) => (
          <Card
            key={trip.id}
            className="border border-slate-200 hover:shadow-md transition-shadow bg-white"
          >
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              {/* LEFT SIDE */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-cyan-600" />
                  {trip.city}
                </h3>

                <p className="text-slate-600 text-sm mt-1">{trip.dates}</p>

                <p className="text-sm text-slate-500 mt-1">
                  {trip.daysLeft >= 0 ? `${trip.daysLeft} days left` : "Trip completed"}
                </p>

                {/* BADGES SECTION */}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  
                  {/* Budget Type */}
                  <Badge className="bg-cyan-50 text-cyan-700 border-cyan-100">
                    💰 {trip.budgetType}
                  </Badge>

                  {/* Budget Amount */}
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">
                    ₹{trip.budgetAmount}
                  </Badge>

                  {/* Transport */}
                  <Badge className="bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1">
                    {trip.transport === "Flight" ? <Plane className="h-4 w-4" /> : <Train className="h-4 w-4" />}
                    {trip.transport}
                  </Badge>

                  {/* Trip Cost */}
                  <Badge className="bg-slate-50 text-slate-700 border-slate-200">
                    ₹{trip.cost}
                  </Badge>
                </div>

                {/* Hotel Info */}
                {trip.hotel && (
                  <p className="text-slate-700 text-sm mt-3 flex items-center gap-1">
                    🏨 {trip.hotel}
                    <span className="text-yellow-500 flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400" />
                      {trip.rating}
                    </span>
                  </p>
                )}
              </div>

              {/* BUTTONS */}
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 gap-1">
                  <Eye className="h-4 w-4" /> View
                </Button>

                <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50 gap-1">
                  <Pencil className="h-4 w-4" /> Modify
                </Button>

                <Button variant="ghost" size="sm" onClick={() => handleDelete(trip.id)} className="text-rose-600 hover:bg-rose-50 gap-1">
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
    <div id="mytrips-section">
      {/* DYNAMIC STATISTICS */}
      <StatsGrid stats={stats} />

      <Tabs defaultValue="upcoming" className="w-full mt-8">
        <TabsList className="flex gap-2">
          <TabsTrigger value="upcoming">Upcoming Trips</TabsTrigger>
          <TabsTrigger value="completed">Completed Trips</TabsTrigger>
          <TabsTrigger value="saved">Saved Trips</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">{renderTrips(upcomingTrips)}</TabsContent>
        <TabsContent value="completed">{renderTrips(completedTrips)}</TabsContent>
        <TabsContent value="saved">{renderTrips(savedTrips)}</TabsContent>
      </Tabs>
    </div>
  );
}

export default MyTrips;
