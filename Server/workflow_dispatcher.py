"""At-least-once dispatcher for committed workflow ledger rows."""

import logging
import os
import time
from datetime import timedelta
from uuid import uuid4

from sqlalchemy import or_

from safe_errors import sanitize_error_message
from workflow_ledger import MAX_WORK_ATTEMPTS, utc_now


logger = logging.getLogger(__name__)
DISPATCH_LEASE_SECONDS = 30
MAX_BACKOFF_SECONDS = 300
MAX_DISPATCH_ATTEMPTS = 5


def recover_expired_work(main, now, limit=50):
    expired = (
        main.TripWork.query.filter_by(state="RUNNING")
        .filter(
            main.TripWork.lease_expires_at.is_not(None),
            main.TripWork.lease_expires_at <= now,
        )
        .order_by(main.TripWork.lease_expires_at)
        .limit(limit)
        .all()
    )
    recovered = 0
    for work in expired:
        old_generation = work.generation
        old_task_id = work.celery_task_id
        if work.attempt_count >= MAX_WORK_ATTEMPTS:
            updated = (
                main.TripWork.query.filter_by(
                    id=work.id,
                    state="RUNNING",
                    generation=old_generation,
                    celery_task_id=old_task_id,
                )
                .filter(
                    main.TripWork.attempt_count == work.attempt_count,
                    main.TripWork.attempt_count >= MAX_WORK_ATTEMPTS,
                    main.TripWork.lease_expires_at <= now,
                )
                .update(
                    {
                        "state": "FAILED",
                        "completed_at": now,
                        "lease_expires_at": None,
                        "error_code": "LEASE_EXPIRED_MAX_ATTEMPTS",
                        "error_message": "The workflow exceeded its recovery limit.",
                    },
                    synchronize_session=False,
                )
            )
            if updated == 1 and work.workflow in {"clustering", "budget"}:
                trip = main.db.session.get(main.Trip, work.trip_id)
                if trip is not None:
                    setattr(trip, f"{work.workflow}_status", "FAILURE")
                    setattr(
                        trip,
                        f"{work.workflow}_error",
                        "The workflow exceeded its recovery limit.",
                    )
            elif updated == 1 and work.workflow == "itinerary":
                trip = main.db.session.get(main.Trip, work.trip_id)
                if trip is not None:
                    trip.itinerary_status = "FAILURE"
                    trip.itinerary_error = (
                        "The itinerary solver exceeded its maximum attempt limit."
                    )
                    work.error_code = "SOLVER_MAX_ATTEMPTS"
                    work.error_message = trip.itinerary_error
            recovered += int(updated == 1)
            continue

        next_generation = old_generation + 1
        next_task_id = uuid4().hex
        updated = (
            main.TripWork.query.filter_by(
                id=work.id,
                state="RUNNING",
                generation=old_generation,
                celery_task_id=old_task_id,
            )
            .filter(
                main.TripWork.attempt_count == work.attempt_count,
                main.TripWork.lease_expires_at <= now,
            )
            .update(
                {
                    "state": "QUEUED",
                    "generation": next_generation,
                    "celery_task_id": next_task_id,
                    "enqueued_at": now,
                    "dispatched_at": None,
                    "dispatch_lease_until": None,
                    "started_at": None,
                    "heartbeat_at": None,
                    "lease_expires_at": None,
                    "completed_at": None,
                    "next_attempt_at": now,
                    "result": None,
                    "error_code": "LEASE_EXPIRED",
                    "error_message": "Worker lease expired; workflow requeued.",
                },
                synchronize_session=False,
            )
        )
        if updated == 1 and work.workflow in {"clustering", "budget"}:
            trip = main.db.session.get(main.Trip, work.trip_id)
            if trip is not None:
                setattr(trip, f"{work.workflow}_task_id", next_task_id)
                setattr(trip, f"{work.workflow}_status", "PENDING")
                setattr(trip, f"{work.workflow}_error", None)
        recovered += int(updated == 1)
    if recovered:
        main.db.session.commit()
    else:
        main.db.session.rollback()
    return recovered


def dispatch_queued_work(limit=50):
    import main

    dispatched = 0
    with main.app.app_context():
        now = utc_now()
        recover_expired_work(main, now)

        exhausted_reservations = (
            main.TripWork.query.filter_by(state="QUEUED")
            .filter(
                main.TripWork.workflow.in_(("clustering", "budget")),
                main.TripWork.dispatch_attempt_count >= MAX_DISPATCH_ATTEMPTS,
                main.TripWork.dispatch_lease_until.is_not(None),
                main.TripWork.dispatch_lease_until <= now,
            )
            .all()
        )
        for work in exhausted_reservations:
            generation = work.generation
            task_id = work.celery_task_id
            attempt_count = work.dispatch_attempt_count
            message = (
                "The dispatcher could not confirm task delivery within "
                "the publication attempt limit."
            )
            failed = (
                main.TripWork.query.filter_by(
                    id=work.id,
                    state="QUEUED",
                    generation=generation,
                    celery_task_id=task_id,
                    dispatch_attempt_count=attempt_count,
                )
                .filter(main.TripWork.dispatch_lease_until <= now)
                .update(
                    {
                        "state": "FAILED",
                        "completed_at": now,
                        "dispatch_lease_until": None,
                        "error_code": "DISPATCH_FAILED_MAX_ATTEMPTS",
                        "error_message": message,
                    },
                    synchronize_session=False,
                )
            )
            if failed == 1:
                trip = main.db.session.get(main.Trip, work.trip_id)
                if trip is not None:
                    setattr(trip, f"{work.workflow}_status", "FAILURE")
                    setattr(trip, f"{work.workflow}_error", message)
            main.db.session.commit()

        candidates = (
            main.TripWork.query.filter_by(state="QUEUED")
            .filter(main.TripWork.workflow.in_(("clustering", "budget")))
            .filter(
                main.TripWork.dispatch_attempt_count
                < MAX_DISPATCH_ATTEMPTS
            )
            .filter(
                or_(
                    main.TripWork.next_attempt_at.is_(None),
                    main.TripWork.next_attempt_at <= now,
                )
            )
            .filter(
                or_(
                    main.TripWork.dispatch_lease_until.is_(None),
                    main.TripWork.dispatch_lease_until <= now,
                )
            )
            .order_by(main.TripWork.id)
            .limit(limit)
            .all()
        )

        for candidate in candidates:
            generation = candidate.generation
            task_id = candidate.celery_task_id
            previous_attempt_count = candidate.dispatch_attempt_count
            reserved_attempt_count = previous_attempt_count + 1
            dispatch_lease_until = now + timedelta(
                seconds=DISPATCH_LEASE_SECONDS
            )
            claimed = (
                main.TripWork.query.filter_by(
                    id=candidate.id,
                    state="QUEUED",
                    generation=generation,
                    celery_task_id=task_id,
                    dispatch_attempt_count=previous_attempt_count,
                )
                .filter(
                    or_(
                        main.TripWork.dispatch_lease_until.is_(None),
                        main.TripWork.dispatch_lease_until
                        <= now,
                    )
                )
                .update(
                    {
                            "dispatch_lease_until": dispatch_lease_until,
                            "dispatch_attempt_count": (
                                main.TripWork.dispatch_attempt_count + 1
                            ),
                        },
                    synchronize_session=False,
                )
            )
            if claimed != 1:
                main.db.session.rollback()
                continue
            main.db.session.commit()
            logger.info(
                "Claimed workflow dispatch for trip %s "
                "(workflow=%s, task_id=%s, generation=%s, attempt=%s)",
                candidate.trip_id,
                candidate.workflow,
                task_id,
                generation,
                reserved_attempt_count,
            )

            trip = main.db.session.get(main.Trip, candidate.trip_id)
            try:
                main._queue_trip_task(
                    trip,
                    candidate.workflow,
                    task_id,
                    generation=generation,
                )
                main.TripWork.query.filter_by(
                    id=candidate.id,
                    state="QUEUED",
                    generation=generation,
                    celery_task_id=task_id,
                    dispatch_attempt_count=reserved_attempt_count,
                    dispatch_lease_until=dispatch_lease_until,
                ).update(
                    {
                        "dispatched_at": utc_now(),
                        "dispatch_lease_until": utc_now()
                        + timedelta(seconds=DISPATCH_LEASE_SECONDS),
                        "error_code": None,
                        "error_message": None,
                    },
                    synchronize_session=False,
                )
                main.db.session.commit()
                dispatched += 1
            except Exception as error:
                main.db.session.rollback()
                current = main.db.session.get(main.TripWork, candidate.id)
                if (
                    current is None
                    or current.state != "QUEUED"
                    or current.generation != generation
                    or current.celery_task_id != task_id
                    or current.dispatch_attempt_count != reserved_attempt_count
                ):
                    continue
                attempt_count = current.dispatch_attempt_count
                safe_error = main.sanitize_error_message(error)
                if attempt_count >= MAX_DISPATCH_ATTEMPTS:
                    failed = (
                        main.TripWork.query.filter_by(
                            id=current.id,
                            state="QUEUED",
                            generation=generation,
                            celery_task_id=task_id,
                            dispatch_attempt_count=attempt_count,
                            dispatch_lease_until=dispatch_lease_until,
                        )
                        .update(
                            {
                                "state": "FAILED",
                                "completed_at": utc_now(),
                                "dispatch_lease_until": None,
                                "error_code": "DISPATCH_FAILED_MAX_ATTEMPTS",
                                "error_message": safe_error,
                            },
                            synchronize_session=False,
                        )
                    )
                    if failed == 1 and current.workflow in {
                        "clustering",
                        "budget",
                    }:
                        trip = main.db.session.get(main.Trip, current.trip_id)
                        if trip is not None:
                            setattr(trip, f"{current.workflow}_status", "FAILURE")
                            setattr(trip, f"{current.workflow}_error", safe_error)
                    main.db.session.commit()
                    if failed == 1:
                        logger.error(
                            "Workflow %s for trip %s failed after %s publication attempts: %s",
                            current.workflow,
                            current.trip_id,
                            attempt_count,
                            safe_error,
                        )
                    continue

                delay = min(
                    2 ** min(max(attempt_count - 1, 0), 8),
                    MAX_BACKOFF_SECONDS,
                )
                rescheduled = (
                    main.TripWork.query.filter_by(
                        id=current.id,
                        state="QUEUED",
                        generation=generation,
                        celery_task_id=task_id,
                        dispatch_attempt_count=attempt_count,
                        dispatch_lease_until=dispatch_lease_until,
                    )
                    .update(
                        {
                            "dispatch_lease_until": None,
                            "next_attempt_at": utc_now()
                            + timedelta(seconds=delay),
                            "error_code": "DISPATCH_FAILED",
                            "error_message": safe_error,
                        },
                        synchronize_session=False,
                    )
                )
                main.db.session.commit()
                if rescheduled == 1:
                    logger.error(
                        "Could not dispatch workflow %s for trip %s: %s",
                        current.workflow,
                        current.trip_id,
                        safe_error,
                    )
    return dispatched


def run_dispatcher(poll_interval_seconds=None):
    interval = poll_interval_seconds or float(
        os.getenv("WORKFLOW_DISPATCH_INTERVAL_SECONDS", "2")
    )
    logger.info(
        "Starting workflow dispatcher (poll interval=%s seconds)",
        interval,
    )
    while True:
        try:
            dispatch_queued_work()
        except Exception as error:
            logger.error(
                "Workflow dispatcher iteration failed: %s",
                sanitize_error_message(error),
            )
        time.sleep(interval)


if __name__ == "__main__":
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
    run_dispatcher()
