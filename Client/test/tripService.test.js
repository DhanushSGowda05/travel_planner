import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const serviceSource = await readFile(
  new URL("../src/services/tripService.jsx", import.meta.url),
  "utf8"
);
const serviceModule = await import(
  `data:text/javascript;base64,${globalThis.Buffer.from(serviceSource).toString("base64")}`
);

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("ILP service marks HTTP 202 as pending, not an itinerary", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    jsonResponse(
      {
        status: "processing",
        message: "Clustering is still running.",
        retry_after_seconds: 3,
      },
      202
    );

  try {
    const result = await serviceModule.runIlpSolver({ trip_id: 17 });
    assert.equal(result.pending, true);
    assert.equal(result.status, "processing");
    assert.equal(result.itinerary, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("itinerary service preserves processing status from HTTP 202", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    jsonResponse(
      {
        exists: false,
        status: "processing",
        reason: "itinerary_not_ready",
        retry_after_seconds: 3,
      },
      202
    );

  try {
    const result = await serviceModule.getItineraryFromDB(17);
    assert.equal(result.status, "processing");
    assert.equal(result.exists, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("itinerary service preserves the completed response envelope", async () => {
  const originalFetch = globalThis.fetch;
  const itinerary = { "2026-11-01": { places: [], meals: [] } };
  globalThis.fetch = async () =>
    jsonResponse(
      { exists: true, status: "completed", itinerary },
      200
    );

  try {
    const result = await serviceModule.getItineraryFromDB(17);
    assert.deepEqual(result, {
      exists: true,
      status: "completed",
      itinerary,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("completed itinerary is returned without checking tasks or invoking solver", async () => {
  const originalFetch = globalThis.fetch;
  const itinerary = { "2026-11-01": { places: [], meals: [] } };
  let requests = 0;
  let taskChecks = 0;
  globalThis.fetch = async () => {
    requests += 1;
    return jsonResponse(
      { exists: true, status: "completed", itinerary },
      200
    );
  };

  try {
    const result = await serviceModule.loadOrGenerateItinerary(
      17,
      async () => {
        taskChecks += 1;
        return true;
      }
    );
    assert.equal(result.generated, false);
    assert.deepEqual(result.itinerary, itinerary);
    assert.equal(requests, 1);
    assert.equal(taskChecks, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("empty completed itinerary is returned without invoking solver", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    jsonResponse(
      { exists: true, status: "completed", itinerary: {} },
      200
    );
  let taskChecks = 0;

  try {
    const result = await serviceModule.loadOrGenerateItinerary(
      17,
      async () => {
        taskChecks += 1;
        return true;
      }
    );
    assert.equal(result.generated, false);
    assert.deepEqual(result.itinerary, {});
    assert.equal(taskChecks, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("polling returns as soon as a completed itinerary is observed", async () => {
  let requests = 0;
  const result = await serviceModule.pollUntil(
    async () => {
      requests += 1;
      return requests === 1
        ? { status: "processing" }
        : { exists: true, status: "completed", itinerary: {} };
    },
    (value) => value.status === "completed",
    { timeoutMs: 100, pollIntervalMs: 1 }
  );

  assert.equal(result.status, "completed");
  assert.equal(requests, 2);
});

test("itinerary polling rechecks a processing solver to recover expired claims", async () => {
  const originalFetch = globalThis.fetch;
  const responses = [
    jsonResponse({ exists: false, status: "processing" }, 202),
    jsonResponse({ status: "processing" }, 202),
    jsonResponse({ exists: false, status: "processing" }, 202),
    jsonResponse({ "2026-11-01": { places: [] } }, 200),
  ];
  const requests = [];
  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url, method: options.method || "GET" });
    return responses.shift();
  };

  try {
    const firstPoll = await serviceModule.getItineraryAndRecover(17);
    const recoveredPoll = await serviceModule.getItineraryAndRecover(17);
    assert.equal(firstPoll.status, "processing");
    assert.deepEqual(recoveredPoll, {
      exists: true,
      status: "completed",
      itinerary: { "2026-11-01": { places: [] } },
    });
    assert.deepEqual(
      requests.map(({ url, method }) => ({
        path: new URL(url).pathname,
        method,
      })),
      [
        { path: "/itinerary/17", method: "GET" },
        { path: "/ilp_solver", method: "POST" },
        { path: "/itinerary/17", method: "GET" },
        { path: "/ilp_solver", method: "POST" },
      ]
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("itinerary polling terminates on exhausted solver attempts without resubmitting", async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    return jsonResponse(
      {
        exists: false,
        status: "failed",
        reason: "solver_attempts_exhausted",
        error: "The itinerary solver exceeded its maximum attempt limit.",
      },
      500
    );
  };

  try {
    const result = await serviceModule.pollUntil(
      (signal) => serviceModule.getItineraryAndRecover(17, signal),
      (value) => value?.status === "failed",
      { timeoutMs: 50, pollIntervalMs: 1 }
    );
    assert.equal(result.reason, "solver_attempts_exhausted");
    assert.equal(requests, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("polling times out even if an individual request never settles", async () => {
  let requests = 0;
  await assert.rejects(
    serviceModule.pollUntil(
      () => {
        requests += 1;
        return new Promise(() => {});
      },
      () => false,
      { timeoutMs: 10, pollIntervalMs: 1 }
    ),
    { name: "PollingTimeoutError" }
  );
  assert.equal(requests, 1);
});

test("polling surfaces network failures instead of looping forever", async () => {
  await assert.rejects(
    serviceModule.pollUntil(
      async () => {
        throw new TypeError("Failed to fetch");
      },
      () => false,
      { timeoutMs: 50, pollIntervalMs: 1 }
    ),
    /Failed to fetch/
  );
});

test("polling settles on navigation cancellation even if fetch ignores abort", async () => {
  const controller = new AbortController();
  let completionChecks = 0;
  const polling = serviceModule.pollUntil(
    () => new Promise(() => {}),
    () => {
      completionChecks += 1;
      return true;
    },
    { signal: controller.signal, timeoutMs: 1000 }
  );

  controller.abort();

  assert.equal(await polling, null);
  assert.equal(completionChecks, 0);
});

test("hotel service preserves pending status for the caller to poll", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    jsonResponse(
      { status: "processing", retry_after_seconds: 3 },
      202
    );

  try {
    const result = await serviceModule.getHotelOptions({ trip_id: 17 });
    assert.equal(result.status, "processing");
    assert.equal(result.hotels, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
