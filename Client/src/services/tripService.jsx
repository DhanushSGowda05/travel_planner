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
   UPDATE TRANSPORT NEED + TYPE
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
   FETCH TRANSPORT OPTIONS
   BACKEND expects: { trip_id, u_d: "u" | "d" }
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
   SAVE ARRIVAL TRANSPORT CHOICE (UP)
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
   SAVE DEPARTURE TRANSPORT CHOICE (DOWN)
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
  let res = await fetch(`${BASE}/trip/${tripId}`, {
    credentials: "include",
  });

  if (res.ok) return res.json();

  // Fallback
  res = await fetch(`${BASE}/list_trips`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch trip");

  const list = await res.json();
  return list.find((t) => String(t.id) === String(tripId));
}

/* -----------------------------------------------------
   UPDATE ACCOMMODATION
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
   FETCH HOTEL OPTIONS
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

/* -----------------------------------------------------
   SAVE HOTEL CHOICE
----------------------------------------------------- */
export async function chooseHotel(payload) {
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
   DELETE TRIP
----------------------------------------------------- */
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
/* -----------------------------------------------------
   RUN ILP SOLVER (GENERATE ITINERARY)
   BACKEND expects: { trip_id }
----------------------------------------------------- */

export async function runIlpSolver(payload) {
  const res = await fetch(`${BASE}/ilp_solver`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const message =
      typeof data === "object"
        ? data.details || data.error || JSON.stringify(data)
        : data;

    throw new Error(
      `ILP solver failed (${res.status}): ${message}`
    );
  }

  return data;
}


//view button get itinerary

export async function getItineraryFromDB(tripId) {
  const res = await fetch(`${BASE}/itinerary/${tripId}`, {
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  // The trip exists, but the itinerary is not ready yet.
  if (res.status === 202) {
    return null;
  }

  if (!res.ok) {
    const message =
      typeof data === "object"
        ? data.details || data.error || data.reason || JSON.stringify(data)
        : data;

    throw new Error(
      `Failed to fetch itinerary (${res.status}): ${message}`
    );
  }

  return data.itinerary ?? null;
}

