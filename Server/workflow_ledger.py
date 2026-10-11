"""Database-backed workflow claims and fenced completion helpers."""

from datetime import datetime, timedelta, timezone
from threading import Event, Thread

from sqlalchemy import func


DEFAULT_LEASE_SECONDS = 120
HEARTBEAT_INTERVAL_SECONDS = 30
MAX_WORK_ATTEMPTS = 5
SOLVER_ATTEMPTS_EXHAUSTED_MESSAGE = (
    "The itinerary solver exceeded its maximum attempt limit."
)


def utc_now():
    return datetime.now(timezone.utc)


def _as_utc(value):
    if value is None or value.tzinfo is not None:
        return value
    return value.replace(tzinfo=timezone.utc)


def _application():
    import main

    return main


def enqueue_work(trip_id, workflow, task_id, generation=1):
    main = _application()
    work = main.TripWork(
        trip_id=trip_id,
        workflow=workflow,
        state="QUEUED",
        generation=generation,
        celery_task_id=task_id,
        enqueued_at=utc_now(),
        next_attempt_at=utc_now(),
    )
    main.db.session.add(work)
    return work


def claim_task(trip_id, workflow, task_id, generation):
    main = _application()
    now = utc_now()
    query = main.TripWork.query.filter_by(
        trip_id=trip_id,
        workflow=workflow,
        state="QUEUED",
        celery_task_id=task_id,
        generation=generation,
    )
    claimed = query.update(
        {
            "state": "RUNNING",
            "attempt_count": main.TripWork.attempt_count + 1,
            "started_at": func.coalesce(main.TripWork.started_at, now),
            "heartbeat_at": now,
            "lease_expires_at": now + timedelta(seconds=DEFAULT_LEASE_SECONDS),
            "error_code": None,
            "error_message": None,
            "dispatch_lease_until": None,
        },
        synchronize_session=False,
    )
    if claimed != 1:
        main.db.session.rollback()
        return False
    trip = main.db.session.get(main.Trip, trip_id)
    if trip is not None:
        setattr(trip, f"{workflow}_status", "STARTED")
        setattr(trip, f"{workflow}_error", None)
    main.db.session.commit()
    return True


def claim_solver(trip_id, task_id, lease_seconds=DEFAULT_LEASE_SECONDS):
    main = _application()
    now = utc_now()
    work = main.TripWork.query.filter_by(
        trip_id=trip_id,
        workflow="itinerary",
    ).first()
    if work is None:
        work = main.TripWork(
            trip_id=trip_id,
            workflow="itinerary",
            state="NOT_STARTED",
            generation=0,
            attempt_count=0,
            dispatch_attempt_count=0,
        )
        main.db.session.add(work)
        try:
            main.db.session.flush()
        except Exception as error:
            from sqlalchemy.exc import IntegrityError

            if not isinstance(error, IntegrityError):
                main.db.session.rollback()
                raise
            main.db.session.rollback()
            work = main.TripWork.query.filter_by(
                trip_id=trip_id,
                workflow="itinerary",
            ).first()
            if work is None:
                raise

    old_generation = work.generation
    old_state = work.state
    if old_state == "SUCCEEDED":
        main.db.session.rollback()
        return "SUCCEEDED", old_generation

    if old_state == "FAILED" and work.attempt_count >= MAX_WORK_ATTEMPTS:
        _mark_solver_attempts_exhausted(main, trip_id, work.id)
        main.db.session.rollback()
        return "FAILED", old_generation

    lease_expires_at = _as_utc(work.lease_expires_at)
    if old_state == "RUNNING" and (
        lease_expires_at is None or lease_expires_at > now
    ):
        main.db.session.rollback()
        return "RUNNING", old_generation

    if old_state == "RUNNING" and work.attempt_count >= MAX_WORK_ATTEMPTS:
        failed = (
            main.TripWork.query.filter_by(
                id=work.id,
                state="RUNNING",
                generation=old_generation,
                celery_task_id=work.celery_task_id,
            )
            .filter(
                main.TripWork.attempt_count >= MAX_WORK_ATTEMPTS,
                main.TripWork.lease_expires_at.is_not(None),
                main.TripWork.lease_expires_at <= now,
            )
            .update(
                {
                    "state": "FAILED",
                    "completed_at": now,
                    "lease_expires_at": None,
                    "error_code": "SOLVER_MAX_ATTEMPTS",
                    "error_message": SOLVER_ATTEMPTS_EXHAUSTED_MESSAGE,
                },
                synchronize_session=False,
            )
        )
        if failed == 1:
            _set_solver_trip_failure(main, trip_id, SOLVER_ATTEMPTS_EXHAUSTED_MESSAGE)
            main.db.session.commit()
            return "FAILED", old_generation
        main.db.session.rollback()
        latest = (
            main.TripWork.query.filter_by(
                trip_id=trip_id,
                workflow="itinerary",
            )
            .populate_existing()
            .first()
        )
        return (
            latest.state if latest is not None else "FAILED",
            latest.generation if latest is not None else old_generation,
        )

    if old_state not in {
        "NOT_STARTED",
        "QUEUED",
        "FAILED",
        "RESULT_UNAVAILABLE",
        "RUNNING",
    }:
        main.db.session.rollback()
        return old_state, old_generation

    generation = old_generation + 1
    eligible = main.TripWork.state == old_state
    if old_state == "RUNNING":
        eligible = eligible & (
            main.TripWork.lease_expires_at.is_not(None)
            & (main.TripWork.lease_expires_at <= now)
        )
    claimed = (
        main.TripWork.query.filter_by(
            id=work.id,
            generation=old_generation,
        )
        .filter(
            eligible,
            main.TripWork.attempt_count < MAX_WORK_ATTEMPTS,
        )
        .update(
            {
                "state": "RUNNING",
                "generation": generation,
                "celery_task_id": task_id,
                "attempt_count": main.TripWork.attempt_count + 1,
                "started_at": now,
                "heartbeat_at": now,
                "lease_expires_at": now + timedelta(seconds=lease_seconds),
                "completed_at": None,
                "result": None,
                "error_code": None,
                "error_message": None,
            },
            synchronize_session=False,
        )
    )
    if claimed != 1:
        main.db.session.rollback()
        latest = (
            main.TripWork.query.filter_by(
                trip_id=trip_id,
                workflow="itinerary",
            )
            .populate_existing()
            .first()
        )
        if latest is not None and latest.state == "FAILED":
            return "FAILED", latest.generation
        return "RUNNING", latest.generation if latest is not None else old_generation
    trip = main.db.session.get(main.Trip, trip_id)
    if trip is not None:
        trip.itinerary_status = "PROCESSING"
        trip.itinerary_error = None
    main.db.session.commit()
    return "CLAIMED", generation


def fail_expired_solver_if_exhausted(trip_id, now=None):
    main = _application()
    now = now or utc_now()
    work = (
        main.TripWork.query.filter_by(
            trip_id=trip_id,
            workflow="itinerary",
            state="RUNNING",
        )
        .filter(
            main.TripWork.attempt_count >= MAX_WORK_ATTEMPTS,
            main.TripWork.lease_expires_at.is_not(None),
            main.TripWork.lease_expires_at <= now,
        )
        .first()
    )
    if work is None:
        main.db.session.rollback()
        return False

    generation = work.generation
    task_id = work.celery_task_id
    attempt_count = work.attempt_count
    updated = (
        main.TripWork.query.filter_by(
            id=work.id,
            workflow="itinerary",
            state="RUNNING",
            generation=generation,
            celery_task_id=task_id,
            attempt_count=attempt_count,
        )
        .filter(
            main.TripWork.lease_expires_at.is_not(None),
            main.TripWork.lease_expires_at <= now,
        )
        .update(
            {
                "state": "FAILED",
                "completed_at": now,
                "lease_expires_at": None,
                "error_code": "SOLVER_MAX_ATTEMPTS",
                "error_message": SOLVER_ATTEMPTS_EXHAUSTED_MESSAGE,
            },
            synchronize_session=False,
        )
    )
    if updated != 1:
        main.db.session.rollback()
        return False
    _set_solver_trip_failure(
        main,
        trip_id,
        SOLVER_ATTEMPTS_EXHAUSTED_MESSAGE,
    )
    main.db.session.commit()
    return True


def _set_solver_trip_failure(main, trip_id, message):
    trip = main.db.session.get(main.Trip, trip_id)
    if trip is not None:
        trip.itinerary_status = "FAILURE"
        trip.itinerary_error = message


def _mark_solver_attempts_exhausted(main, trip_id, work_id):
    work = main.db.session.get(main.TripWork, work_id)
    if work is not None:
        work.error_code = "SOLVER_MAX_ATTEMPTS"
        work.error_message = SOLVER_ATTEMPTS_EXHAUSTED_MESSAGE
        work.completed_at = work.completed_at or utc_now()
        work.lease_expires_at = None
        _set_solver_trip_failure(
            main,
            trip_id,
            SOLVER_ATTEMPTS_EXHAUSTED_MESSAGE,
        )
        main.db.session.commit()


def heartbeat(trip_id, workflow, generation, task_id, lease_seconds=DEFAULT_LEASE_SECONDS):
    main = _application()
    now = utc_now()
    updated = (
        main.TripWork.query.filter_by(
            trip_id=trip_id,
            workflow=workflow,
            state="RUNNING",
            generation=generation,
            celery_task_id=task_id,
        )
        .filter(
            main.TripWork.lease_expires_at.is_not(None),
            main.TripWork.lease_expires_at > now,
        )
        .update(
            {
                "heartbeat_at": now,
                "lease_expires_at": now + timedelta(seconds=lease_seconds),
            },
            synchronize_session=False,
        )
    )
    if updated == 1:
        main.db.session.commit()
        return True
    main.db.session.rollback()
    return False


def complete_work(trip_id, workflow, generation, task_id, result):
    main = _application()
    now = utc_now()
    updated = (
        main.TripWork.query.filter_by(
            trip_id=trip_id,
            workflow=workflow,
            state="RUNNING",
            generation=generation,
            celery_task_id=task_id,
        )
        .filter(
            main.TripWork.lease_expires_at.is_not(None),
            main.TripWork.lease_expires_at > now,
        )
        .update(
            {
                "state": "SUCCEEDED",
                "result": result,
                "completed_at": now,
                "heartbeat_at": now,
                "lease_expires_at": None,
                "error_code": None,
                "error_message": None,
            },
            synchronize_session=False,
        )
    )
    if updated != 1:
        main.db.session.rollback()
        return False
    _update_legacy_status(main, trip_id, workflow, "SUCCESS", None)
    main.db.session.commit()
    return True


def fail_work(trip_id, workflow, generation, task_id, error):
    main = _application()
    safe_error = main.sanitize_error_message(error)
    now = utc_now()
    updated = (
        main.TripWork.query.filter_by(
            trip_id=trip_id,
            workflow=workflow,
            state="RUNNING",
            generation=generation,
            celery_task_id=task_id,
        )
        .filter(
            main.TripWork.lease_expires_at.is_not(None),
            main.TripWork.lease_expires_at > now,
        )
        .update(
            {
                "state": "FAILED",
                "completed_at": now,
                "lease_expires_at": None,
                "error_code": "TASK_FAILED",
                "error_message": safe_error,
            },
            synchronize_session=False,
        )
    )
    if updated != 1:
        main.db.session.rollback()
        return False
    _update_legacy_status(main, trip_id, workflow, "FAILURE", safe_error)
    main.db.session.commit()
    return True


def finish_solver(trip_id, generation, task_id, daily_plan):
    main = _application()
    now = utc_now()
    updated = (
        main.TripWork.query.filter_by(
            trip_id=trip_id,
            workflow="itinerary",
            state="RUNNING",
            generation=generation,
            celery_task_id=task_id,
        )
        .filter(
            main.TripWork.lease_expires_at.is_not(None),
            main.TripWork.lease_expires_at > now,
        )
        .update(
            {
                "state": "SUCCEEDED",
                "completed_at": now,
                "heartbeat_at": now,
                "lease_expires_at": None,
                "result": daily_plan,
                "error_code": None,
                "error_message": None,
            },
            synchronize_session=False,
        )
    )
    if updated != 1:
        main.db.session.rollback()
        return False
    itinerary = main.Itinerary.query.filter_by(trip_id=trip_id).first()
    if itinerary is None:
        itinerary = main.Itinerary(trip_id=trip_id, daily_plan=daily_plan)
        main.db.session.add(itinerary)
    else:
        itinerary.daily_plan = daily_plan
    trip = main.db.session.get(main.Trip, trip_id)
    if trip is not None:
        trip.itinerary_status = "SUCCESS"
        trip.itinerary_error = None
    main.db.session.commit()
    return True


def fail_solver(trip_id, generation, task_id, error):
    main = _application()
    now = utc_now()
    safe_error = main.sanitize_error_message(error)
    work = main.TripWork.query.filter_by(
        trip_id=trip_id,
        workflow="itinerary",
        state="RUNNING",
        generation=generation,
        celery_task_id=task_id,
    ).first()
    if work is None:
        main.db.session.rollback()
        return False
    attempt_count = work.attempt_count
    exhausted = attempt_count >= MAX_WORK_ATTEMPTS
    if exhausted:
        safe_error = SOLVER_ATTEMPTS_EXHAUSTED_MESSAGE
    updated = (
        main.TripWork.query.filter_by(
            trip_id=trip_id,
            workflow="itinerary",
            state="RUNNING",
            generation=generation,
            celery_task_id=task_id,
        )
        .filter(
            main.TripWork.attempt_count == attempt_count,
            main.TripWork.lease_expires_at.is_not(None),
            main.TripWork.lease_expires_at > now,
        )
        .update(
            {
                "state": "FAILED",
                "completed_at": now,
                "lease_expires_at": None,
                "error_code": (
                    "SOLVER_MAX_ATTEMPTS" if exhausted else "SOLVER_FAILED"
                ),
                "error_message": safe_error,
            },
            synchronize_session=False,
        )
    )
    if updated != 1:
        main.db.session.rollback()
        return False
    trip = main.db.session.get(main.Trip, trip_id)
    if trip is not None:
        trip.itinerary_status = "FAILURE"
        trip.itinerary_error = safe_error
    main.db.session.commit()
    return True


def _update_legacy_status(main, trip_id, workflow, state, error):
    trip = main.db.session.get(main.Trip, trip_id)
    if trip is None:
        return
    if workflow in {"clustering", "budget"}:
        setattr(trip, f"{workflow}_status", state)
        setattr(trip, f"{workflow}_error", error)


class LeaseHeartbeat:
    def __init__(self, trip_id, workflow, generation, task_id):
        self.trip_id = trip_id
        self.workflow = workflow
        self.generation = generation
        self.task_id = task_id
        self._stop = Event()
        self._lost = Event()
        self._thread = Thread(target=self._run, daemon=True)

    def start(self):
        self._thread.start()
        return self

    def _run(self):
        while not self._stop.wait(HEARTBEAT_INTERVAL_SECONDS):
            main = _application()
            with main.app.app_context():
                try:
                    owned = heartbeat(
                        self.trip_id,
                        self.workflow,
                        self.generation,
                        self.task_id,
                    )
                except Exception:
                    main.db.session.rollback()
                    self._lost.set()
                    return
            if not owned:
                self._lost.set()
                return

    def assert_owned(self):
        if self._lost.is_set():
            raise RuntimeError("Workflow lease was lost.")

    def stop(self):
        self._stop.set()
        if self._thread.is_alive():
            self._thread.join(timeout=HEARTBEAT_INTERVAL_SECONDS + 1)


def start_heartbeat(trip_id, workflow, generation, task_id):
    return LeaseHeartbeat(trip_id, workflow, generation, task_id).start()
