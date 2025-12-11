const BASE = "http://127.0.0.1:5000";

/* -----------------------------------------------------
   CREATE TRIP
----------------------------------------------------- */
export async function createTrip(payload) {
  const res = await fetch(`${BASE}/create_trip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create trip");
  return res.json();
}

/* -----------------------------------------------------
   UPDATE TRANSPORT NEED + TYPE (Basic/Economy/etc)
----------------------------------------------------- */
export async function updateTransport(payload) {
  const res = await fetch(`${BASE}/update_transport`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update transport");
  return res.json();
}

/* -----------------------------------------------------
   FETCH TRANSPORT OPTIONS (arrival/departure)
   BACKEND expects:  { trip_id, u_d: "u" | "d" }
----------------------------------------------------- */
export async function getTransportOptions(payload) {
  const res = await fetch(`${BASE}/transport_option`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to fetch transport options");
  return res.json();
}

/* -----------------------------------------------------
   SAVE ARRIVAL TRANSPORT CHOICE (UP MODE)
   BACKEND expects: { trip_id, up_mode, up_mode_id }
----------------------------------------------------- */
export async function postUpTransportChoice(payload) {
  const res = await fetch(`${BASE}/up_transport_choice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save arrival transport");
  return res.json();
}

/* -----------------------------------------------------
   SAVE DEPARTURE TRANSPORT CHOICE (DOWN MODE)
   BACKEND expects: { trip_id, down_mode, down_mode_id }
----------------------------------------------------- */
export async function postDownTransportChoice(payload) {
  const res = await fetch(`${BASE}/down_transport_choice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save departure transport");
  return res.json();
}

/* -----------------------------------------------------
   GET TRIP (fallback to list_trips)
----------------------------------------------------- */
export async function getTrip(tripId) {
  let res = await fetch(`${BASE}/trip/${tripId}`, { credentials: "include" });

  if (res.ok) return res.json();

  // FIXED ROUTE HERE (this was the CORS issue)
  res = await fetch(`${BASE}/list_trips`, { credentials: "include" });

  if (!res.ok) throw new Error("Failed to fetch trip");

  const list = await res.json();
  return list.find((t) => String(t.id) === String(tripId));
}

/* -----------------------------------------------------
   UPDATE ACCOMMODATION NEED / TYPE / LOCATION
----------------------------------------------------- */
export async function updateAccommodation(payload) {
  const res = await fetch(`${BASE}/update_accomodation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update accommodation");
  return res.json();
}

/* -----------------------------------------------------
   SAVE HOTEL CHOICE
----------------------------------------------------- */
export async function postHotelChoice(payload) {
  const res = await fetch(`${BASE}/hotel_choice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save hotel choice");
  return res.json();
}

/* -----------------------------------------------------
   OPTIONAL: FETCH HOTEL OPTIONS
----------------------------------------------------- */
export async function getHotelOptions(payload) {
  const res = await fetch(`${BASE}/hotel_option`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to fetch hotels");
  return res.json();
}
//DELETE TRIP
export async function deleteTrip(payload) {
  const res = await fetch(`${BASE}/delete_trip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to delete trip");
  return res.json();
}

