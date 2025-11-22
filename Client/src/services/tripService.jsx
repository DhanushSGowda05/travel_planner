const BASE = "http://127.0.0.1:5000";
 // as you confirmed

export async function createTrip(payload) {
  const res = await fetch(`${BASE}/create_trip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create trip");
  return res.json(); // expects { trip_id: ... }
}

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

export async function getTransportOptions(payload) {
  const res = await fetch(`${BASE}/transport_option`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to fetch transport options");
  return res.json(); // expects { bus:[], train:[], flight:[] }
}

export async function postTransportChoice(payload) {
  const res = await fetch(`${BASE}/transport_choice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save transport choice");
  return res.json();
}

export async function updateAccommodation(payload) {
  const res = await fetch(`${BASE}/update_accommodation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update accommodation");
  return res.json();
}

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

export async function getTrip(tripId) {
  // backend may expose GET /list-trips or GET /trip/:id; we try /trip/:id if exists
  let res = await fetch(`${BASE}/trip/${tripId}`, { credentials: "include" });
  if (res.ok) return res.json();
  // fallback to list-trips and filter (if backend only supports list)
  res = await fetch(`${BASE}/list-trips`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch trip");
  const list = await res.json();
  // expect array of trips
  return list.find((t) => String(t.id) === String(tripId));
}
