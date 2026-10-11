import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppSidebar from "@/components/itinerary/AppSidebar";
import ItineraryPanel from "@/components/itinerary/ItineraryPanel";
import MapPanel from "@/components/itinerary/MapPanel";

import {
  getItineraryAndRecover,
  getTripTaskStatus,
  retryTripTask,
  runIlpSolver,
  loadOrGenerateItinerary,
  pollUntil,
} from "@/services/tripService";
import {
  itineraryPageViewState,
  isCurrentTripRequest,
  tripForRoute,
} from "./itineraryPageState";

/* ----------------------------------------
   Normalize ILP response → Trip shape
---------------------------------------- */
function normalizeIlpResponse(ilpData, tripId) {
  const dates = Object.keys(ilpData).sort();

  return {
    id: String(tripId),
    name: "Generated Trip",
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    itinerary: ilpData,
  };
}

export default function ItineraryPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  /* ------------------ STATE ------------------ */
  const [trip, setTrip] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [error, setError] = useState("");
  const [errorTripId, setErrorTripId] = useState(tripId);
  const [retryTask, setRetryTask] = useState(null);
  const [retrySolver, setRetrySolver] = useState(false);
  const [terminalFailureTripId, setTerminalFailureTripId] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [loadState, setLoadState] = useState("loading");
  const [loadStateTripId, setLoadStateTripId] = useState(tripId);

  const requestGeneration = useRef(0);
  const activeTripId = useRef(tripId);
  const activeControllers = useRef(new Set());
  activeTripId.current = tripId;

  /* ------------------ FETCH ITINERARY ------------------ */
  useEffect(() => {
    if (!tripId) return undefined;

    let cancelled = false;
    const generation = ++requestGeneration.current;
    const controller = new AbortController();
    const controllers = activeControllers.current;
    controllers.add(controller);
    const isCurrent = () => (
      !cancelled &&
      isCurrentTripRequest(
        tripId,
        activeTripId.current,
        generation,
        requestGeneration.current
      )
    );

    const showTaskFailure = (taskName, task) => {
      if (!isCurrent()) return;
      setRetryTask(taskName);
      setRetrySolver(false);
      setErrorTripId(tripId);
      setError(task?.error || `${taskName} task failed.`);
      setLoadState("failed");
      setLoadStateTripId(tripId);
    };

    const waitForTasks = async () => {
      let taskFailed = false;
      const status = await pollUntil(
        (signal) => getTripTaskStatus(tripId, signal),
        (currentStatus) => {
          const clustering = currentStatus.tasks?.clustering;
          const budget = currentStatus.tasks?.budget;

          if (
            ["FAILURE", "RESULT_UNAVAILABLE", "NOT_STARTED"].includes(
              clustering?.status
            )
          ) {
            showTaskFailure("clustering", clustering);
            taskFailed = true;
            return true;
          }
          if (
            ["FAILURE", "RESULT_UNAVAILABLE", "NOT_STARTED"].includes(
              budget?.status
            )
          ) {
            showTaskFailure("budget", budget);
            taskFailed = true;
            return true;
          }
          const clusteringReady = clustering?.status === "SUCCESS";
          const budgetReady = ["SUCCESS", "SKIPPED"].includes(budget?.status);
          return clusteringReady && budgetReady;
        },
        { signal: controller.signal }
      );
      return Boolean(status) && !taskFailed;
    };

    const waitForItinerary = async () => {
      const result = await pollUntil(
        (signal) => getItineraryAndRecover(tripId, signal),
        (currentResult) =>
          Boolean(
            currentResult?.exists && currentResult.itinerary
          ) || currentResult?.status === "failed",
        { signal: controller.signal }
      );
      if (!isCurrent() || !result) return;
      if (result.exists && result.itinerary) {
        setTrip(normalizeIlpResponse(result.itinerary, tripId));
        setLoadState("ready");
        setLoadStateTripId(tripId);
      } else if (result.status === "failed") {
        setErrorTripId(tripId);
        setError(result.error || "Itinerary generation failed.");
        setRetryTask(null);
        const terminal = result.reason === "solver_attempts_exhausted";
        setRetrySolver(!terminal);
        setTerminalFailureTripId(terminal ? tripId : null);
        setLoadState("failed");
        setLoadStateTripId(tripId);
      }
    };

    const loadItinerary = async () => {
      if (isCurrent()) {
        setTrip(null);
        setError("");
        setErrorTripId(tripId);
        setRetryTask(null);
        setRetrySolver(false);
        setTerminalFailureTripId(null);
        setLoadState("loading");
        setLoadStateTripId(tripId);
      }
      try {
        const loaded = await loadOrGenerateItinerary(
          tripId,
          waitForTasks,
          controller.signal
        );
        if (!isCurrent()) return;
        if (loaded.itinerary) {
          setTrip(normalizeIlpResponse(loaded.itinerary, tripId));
          setLoadState("ready");
          setLoadStateTripId(tripId);
          return;
        }
        if (loaded.failure) {
          setErrorTripId(tripId);
          setError(
            loaded.failure.error || "Itinerary generation failed."
          );
          const terminal =
            loaded.failure.reason === "solver_attempts_exhausted";
          setRetrySolver(!terminal);
          setTerminalFailureTripId(terminal ? tripId : null);
          setLoadState("failed");
          setLoadStateTripId(tripId);
          return;
        }
        if (loaded.cancelled) return;
        const result = loaded.result;
        if (!isCurrent()) return;
        if (result?.status === "failed") {
          setErrorTripId(tripId);
          setError(result.error || "Itinerary generation failed.");
          const terminal = result.reason === "solver_attempts_exhausted";
          setRetrySolver(!terminal);
          setRetryTask(null);
          setTerminalFailureTripId(terminal ? tripId : null);
          setLoadState("failed");
          setLoadStateTripId(tripId);
          return;
        }
        if (result?.pending || result?.status === "processing") {
          await waitForItinerary();
          return;
        }
        setTrip(normalizeIlpResponse(result, tripId));
        setLoadState("ready");
        setLoadStateTripId(tripId);
      } catch (loadError) {
        if (!isCurrent()) return;
        setErrorTripId(tripId);
        setError(loadError.message || "Failed to load itinerary.");
        setLoadState("failed");
        setLoadStateTripId(tripId);
        if (/^ILP solver failed \(5\d\d\):/.test(loadError.message || "")) {
          setRetrySolver(true);
        }
      }
    };

    loadItinerary();
    return () => {
      cancelled = true;
      controller.abort();
      controllers.delete(controller);
      if (requestGeneration.current === generation) {
        requestGeneration.current += 1;
      }
    };
  }, [tripId, reloadCount]);

  const handleRetry = async () => {
    const retryTripId = tripId;
    const generation = requestGeneration.current;
    const controller = new AbortController();
    const controllers = activeControllers.current;
    controllers.add(controller);
    const taskToRetry = errorTripId === tripId ? retryTask : null;
    const solverToRetry = errorTripId === tripId && retrySolver;
    const isCurrent = () => isCurrentTripRequest(
      retryTripId,
      activeTripId.current,
      generation,
      requestGeneration.current
    );
    try {
      if (taskToRetry) {
        await retryTripTask(retryTripId, taskToRetry, controller.signal);
      } else if (solverToRetry) {
        const result = await runIlpSolver(
          { trip_id: retryTripId },
          controller.signal
        );
        if (!isCurrent()) return;
        if (!result?.pending && result?.status !== "processing") {
          setTrip(normalizeIlpResponse(result, retryTripId));
          setLoadState("ready");
          setLoadStateTripId(retryTripId);
          return;
        }
      }
      if (!isCurrent()) return;
      setErrorTripId(retryTripId);
      setError("");
      setLoadState("loading");
      setLoadStateTripId(retryTripId);
      setReloadCount((count) => count + 1);
    } catch (retryError) {
      if (!isCurrent()) return;
      setErrorTripId(retryTripId);
      setError(retryError.message || "Failed to retry itinerary generation.");
      setLoadState("failed");
      setLoadStateTripId(retryTripId);
    } finally {
      controller.abort();
      controllers.delete(controller);
    }
  };

  useEffect(() => {
    setSelectedDate(null);
    setSelectedPlace(null);
    const controllers = activeControllers.current;
    return () => {
      for (const controller of controllers) {
        controller.abort();
      }
      controllers.clear();
    };
  }, [tripId]);

  /* ------------------ DERIVED DATA ------------------ */
  const currentTrip = tripForRoute(trip, tripId);
  const routeHasError = String(errorTripId) === String(tripId);
  const currentError = routeHasError ? error : "";
  const currentRetryTask = routeHasError ? retryTask : null;
  const currentRetrySolver = routeHasError && retrySolver;
  const currentTerminalFailure =
    String(terminalFailureTripId) === String(tripId);
  const currentLoadState = String(loadStateTripId) === String(tripId)
    ? loadState
    : "loading";
  const pageViewState = itineraryPageViewState(currentLoadState, currentTrip);
  const sortedDates = useMemo(() => {
    if (!currentTrip?.itinerary) return [];
    return Object.keys(currentTrip.itinerary).sort();
  }, [currentTrip]);

  useEffect(() => {
    if (!selectedDate && sortedDates.length > 0) {
      setSelectedDate(sortedDates[0]);
    }
  }, [sortedDates, selectedDate]);

  const currentSelectedDate = sortedDates.includes(selectedDate)
    ? selectedDate
    : sortedDates[0] ?? null;

  const currentDayIndex = useMemo(() => {
    return sortedDates.findIndex(
      (d) => d === currentSelectedDate
    );
  }, [sortedDates, currentSelectedDate]);

  const currentDay = useMemo(() => {
    if (!currentTrip || !currentSelectedDate) return null;
    return currentTrip.itinerary[currentSelectedDate];
  }, [currentTrip, currentSelectedDate]);

  const daysArray = useMemo(() => {
    if (!currentTrip?.itinerary) return [];
    return sortedDates.map(
      (date) => currentTrip.itinerary[date]
    );
  }, [sortedDates, currentTrip]);

  const currentSelectedPlace = useMemo(() => {
    if (!currentTrip || !selectedPlace) return null;
    return daysArray
      .flatMap((day) => day?.places || [])
      .find((place) => String(place.id) === String(selectedPlace.id)) || null;
  }, [currentTrip, daysArray, selectedPlace]);

  const allPlacesForCurrentDay =
    currentDay?.places || [];

  /* ------------------ HANDLERS ------------------ */
  const handleSelectPlace = useCallback(
    (place) => {
      setSelectedPlace(place);

      if (place && currentTrip?.itinerary) {
        const dateWithPlace = sortedDates.find(
          (date) =>
            currentTrip.itinerary[date].places.some(
              (p) => p.id === place.id
            )
        );

        if (dateWithPlace) {
          setSelectedDate(dateWithPlace);
        }
      }
    },
    [sortedDates, currentTrip]
  );

  const handleNavigateDay = useCallback(
    (direction) => {
      const newIndex =
        direction === "prev"
          ? currentDayIndex - 1
          : currentDayIndex + 1;

      if (
        newIndex >= 0 &&
        newIndex < sortedDates.length
      ) {
        setSelectedDate(sortedDates[newIndex]);
        setSelectedPlace(null);
      }
    },
    [currentDayIndex, sortedDates]
  );

  /* ------------------ UI ------------------ */
  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {pageViewState === "failed" ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <h1 className="text-xl font-semibold">Unable to load itinerary</h1>
          <p className="text-red-600">
            {currentError || "Please try loading this itinerary again."}
          </p>
          {currentTerminalFailure ? (
            <button
              type="button"
              className="rounded bg-teal-600 px-4 py-2 text-white"
              onClick={() => navigate("/trip/new")}
            >
              Return to trip planning
            </button>
          ) : (currentRetryTask || currentRetrySolver) ? (
            <button
              type="button"
              className="rounded bg-teal-600 px-4 py-2 text-white"
              onClick={handleRetry}
            >
              Retry
            </button>
          ) : (
            <button
              type="button"
              className="rounded bg-teal-600 px-4 py-2 text-white"
              onClick={() => {
                setError("");
                setLoadState("loading");
                setLoadStateTripId(tripId);
                setReloadCount((count) => count + 1);
              }}
            >
              Try again
            </button>
          )}
        </div>
      ) : pageViewState === "empty" ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-xl font-semibold">No itinerary days available</h1>
          <p className="max-w-lg text-slate-600">
            This itinerary is complete, but no days were scheduled. Return to trip
            planning to adjust your trip and create a new itinerary.
          </p>
          <button
            type="button"
            className="rounded bg-teal-600 px-4 py-2 text-white"
            onClick={() => navigate("/trip/new")}
          >
            Return to trip planning
          </button>
        </div>
      ) : pageViewState === "loading" ? (
        <div
          className="flex-1 flex items-center justify-center p-6"
          role="status"
          aria-live="polite"
        >
          Preparing your itinerary...
        </div>
      ) : (
        <>
          {/* Sidebar */}
          <AppSidebar
            days={daysArray}
            selectedDate={currentSelectedDate}
            onSelectDay={(date) => {
              setSelectedDate(date);
              setSelectedPlace(null);
            }}
            isOpen={sidebarOpen}
            onToggle={() =>
              setSidebarOpen(!sidebarOpen)
            }
          />

          {/* Main Content */}
          <div className="flex-1 flex min-w-0">
            {/* Itinerary Panel */}
            <div className="w-[40%] min-w-[360px] border-r border-border">
              <ItineraryPanel
                tripName={currentTrip.name}
                startDate={currentTrip.startDate}
                endDate={currentTrip.endDate}
                days={daysArray}
                selectedPlaceId={
                  currentSelectedPlace
                    ? String(currentSelectedPlace.id)
                    : null
                }
                selectedDate={currentSelectedDate}
                onSelectPlace={handleSelectPlace}
              />
            </div>

            {/* Map Panel */}
            <div className="flex-1">
              <MapPanel
                places={allPlacesForCurrentDay}
                selectedPlace={currentSelectedPlace}
                onSelectPlace={handleSelectPlace}
                currentDayIndex={currentDayIndex}
                totalDays={sortedDates.length}
                onNavigateDay={handleNavigateDay}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
