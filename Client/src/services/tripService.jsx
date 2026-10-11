const BASE =
  import.meta.env?.VITE_API_BASE_URL || "http://127.0.0.1:5000";

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
export async function getHotelOptions(payload, signal) {
  const res = await fetch(`${BASE}/hotel_option`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
    signal,
  });

  const data = await res.json();
  if (res.status === 202 || res.ok || data.status === "failed") return data;
  throw new Error(data.error || "Failed to fetch hotels");
}

export async function getTripTaskStatus(tripId, signal) {
  const res = await fetch(`${BASE}/trip/${tripId}/status`, {
    credentials: "include",
    signal,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch trip status");
  return data;
}

export async function retryTripTask(tripId, taskName, signal) {
  const res = await fetch(
    `${BASE}/trip/${tripId}/tasks/${taskName}/retry`,
    {
      method: "POST",
      credentials: "include",
      signal,
    }
  );
  const data = await res.json();
  if (res.status === 202 || res.ok) return data;
  throw new Error(data.error || "Failed to retry trip task");
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

export async function runIlpSolver(payload, signal) {
  const res = await fetch(`${BASE}/ilp_solver`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
    signal,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (res.status === 202) {
    return {
      ...data,
      pending: true,
    };
  }

  if (!res.ok) {
    if (data?.reason === "solver_attempts_exhausted") {
      return data;
    }
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

export async function getItineraryFromDB(tripId, signal) {
  const res = await fetch(`${BASE}/itinerary/${tripId}`, {
    credentials: "include",
    signal,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (res.status === 202) {
    return data;
  }

  if (data?.status === "failed") {
    return data;
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

  return data;
}

export async function getItineraryAndRecover(tripId, signal) {
  const current = await getItineraryFromDB(tripId, signal);
  if (current?.status !== "processing") return current;

  const recovered = await runIlpSolver({ trip_id: tripId }, signal);
  if (recovered?.status === "failed") return recovered;
  if (recovered?.pending || recovered?.status === "processing") {
    return current;
  }
  return {
    exists: true,
    status: "completed",
    itinerary: recovered,
  };
}

export async function loadOrGenerateItinerary(
  tripId,
  waitForTasks,
  signal
) {
  const saved = await getItineraryFromDB(tripId, signal);
  if (saved?.exists && saved.itinerary) {
    return { itinerary: saved.itinerary, generated: false };
  }
  if (saved?.status === "failed") {
    return { failure: saved, generated: false };
  }

  const ready = await waitForTasks();
  if (!ready || signal?.aborted) return { cancelled: true, generated: false };
  return {
    result: await runIlpSolver({ trip_id: tripId }, signal),
    generated: true,
  };
}

export class PollingTimeoutError extends Error {
  constructor() {
    super(
      "This is taking longer than expected. Check again shortly; the task was not restarted."
    );
    this.name = "PollingTimeoutError";
  }
}

export async function pollUntil(
  fetchValue,
  isComplete,
  {
    signal,
    timeoutMs = 5 * 60 * 1000,
    pollIntervalMs = 3000,
  } = {}
) {
  const deadline = Date.now() + timeoutMs;
  while (!signal?.aborted) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new PollingTimeoutError();

    const requestController = new AbortController();
    let resolveAbort;
    const aborted = new Promise((resolve) => {
      resolveAbort = resolve;
    });
    const abortRequest = () => {
      requestController.abort();
      resolveAbort(null);
    };
    signal?.addEventListener("abort", abortRequest, { once: true });
    if (signal?.aborted) abortRequest();
    let timeoutId;
    const timeout = new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        abortRequest();
        reject(new PollingTimeoutError());
      }, remaining);
    });
    let value;
    try {
      value = await Promise.race([
        fetchValue(requestController.signal),
        timeout,
        aborted,
      ]);
    } catch (error) {
      if (signal?.aborted) return null;
      if (Date.now() >= deadline) throw new PollingTimeoutError();
      throw error;
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", abortRequest);
    }

    if (signal?.aborted) return null;
    if (isComplete(value)) return value;
    const waitMs = Math.min(pollIntervalMs, deadline - Date.now());
    if (waitMs <= 0) throw new PollingTimeoutError();
    await new Promise((resolve) => {
      let timeout;
      const finish = () => {
        clearTimeout(timeout);
        signal?.removeEventListener("abort", finish);
        resolve();
      };
      timeout = setTimeout(finish, waitMs);
      signal?.addEventListener("abort", finish, { once: true });
    });
  }
  return null;
}


/* -----------------------------------------------------
   FETCH AI PLACE INSIGHTS
----------------------------------------------------- */
export async function getPlaceInsights(
  tripId,
  placeId,
  placeName,
  signal
) {
  const res = await fetch(
    `${BASE}/trip/${encodeURIComponent(tripId)}/places/insights`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal,
      body: JSON.stringify({
        place_id: placeId,
        place_name: placeName,
      }),
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.error || "Unable to load insights for this place."
    );
  }

  return data;
}
