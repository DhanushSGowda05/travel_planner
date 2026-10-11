import assert from "node:assert/strict";
import test from "node:test";
import {
  itineraryPageViewState,
  isCurrentTripRequest,
  tripForRoute,
} from "../src/pages/itineraryPageState.js";

test("itinerary page distinguishes initial loading from an empty completed plan", () => {
  assert.equal(itineraryPageViewState("loading", null), "loading");
  assert.equal(
    itineraryPageViewState("ready", {
      id: "1",
      itinerary: {},
    }),
    "empty"
  );
});

test("itinerary page distinguishes load failure from loading", () => {
  assert.equal(itineraryPageViewState("failed", null), "failed");
  assert.equal(itineraryPageViewState("loading", null), "loading");
});

test("itinerary page keeps a completed itinerary with days ready to render", () => {
  assert.equal(
    itineraryPageViewState("ready", {
      id: "1",
      itinerary: { "2026-11-01": { places: [] } },
    }),
    "ready"
  );
});

test("trip A is never selected as the rendered trip on trip B route", () => {
  const tripA = { id: "1", itinerary: { "2026-11-01": {} } };

  assert.equal(tripForRoute(tripA, "2"), null);
  assert.equal(tripForRoute(tripA, "1"), tripA);
});

test("late request and retry results are stale after switching trips", () => {
  const requestTripId = "1";
  const activeTripId = "2";
  const requestGeneration = 4;
  const activeGeneration = 5;

  assert.equal(
    isCurrentTripRequest(
      requestTripId,
      activeTripId,
      requestGeneration,
      requestGeneration
    ),
    false
  );
  assert.equal(
    isCurrentTripRequest(
      "2",
      "2",
      requestGeneration,
      activeGeneration
    ),
    false
  );
  assert.equal(
    isCurrentTripRequest("2", "2", activeGeneration, activeGeneration),
    true
  );
});

test("a retry resolving after navigation does not update the new trip page", async () => {
  let activeTripId = "trip-a";
  let requestGeneration = 3;
  let displayedTrip = null;
  let resolveRetry;
  const retryResult = new Promise((resolve) => {
    resolveRetry = resolve;
  });

  const retry = retryResult.then((result) => {
    if (
      isCurrentTripRequest(
        "trip-a",
        activeTripId,
        3,
        requestGeneration
      )
    ) {
      displayedTrip = result;
    }
  });

  activeTripId = "trip-b";
  requestGeneration += 1;
  resolveRetry({ id: "trip-a", itinerary: {} });
  await retry;

  assert.equal(displayedTrip, null);
});
