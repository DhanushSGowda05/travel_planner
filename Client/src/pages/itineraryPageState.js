export function tripForRoute(trip, tripId) {
  return trip?.id === String(tripId) ? trip : null;
}

export function itineraryPageViewState(loadState, trip) {
  if (loadState === "failed") return "failed";
  if (loadState !== "ready" || !trip) return "loading";
  return Object.keys(trip.itinerary || {}).length === 0 ? "empty" : "ready";
}

export function isCurrentTripRequest(
  requestTripId,
  activeTripId,
  requestGeneration,
  activeGeneration
) {
  return (
    String(requestTripId) === String(activeTripId) &&
    requestGeneration === activeGeneration
  );
}
