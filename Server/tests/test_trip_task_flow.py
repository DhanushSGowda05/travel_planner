import os
import copy
import runpy
import sys
import tempfile
import unittest
from threading import Barrier
from contextlib import ExitStack
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import Mock, patch

TEST_DATABASE_DIRECTORY = tempfile.TemporaryDirectory(
    prefix="tripcraft-test-"
)
TEST_DATABASE_PATH = Path(TEST_DATABASE_DIRECTORY.name) / "test.sqlite"
ORIGINAL_DATABASE_URI = os.environ.get("SQLALCHEMY_DATABASE_URI")
os.environ["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{TEST_DATABASE_PATH}"

import main
import poi_get
import tasks
import workflow_ledger
import workflow_dispatcher
from clustering_validation import validate_clustering_result

if ORIGINAL_DATABASE_URI is None:
    os.environ.pop("SQLALCHEMY_DATABASE_URI", None)
else:
    os.environ["SQLALCHEMY_DATABASE_URI"] = ORIGINAL_DATABASE_URI


def valid_clustering_result(place_name):
    return {
        "Places": [
            {
                "id": 1,
                "name": place_name,
                "latitude": 19.0,
                "longitude": 72.0,
                "smart_score": 10,
                "is_mandatory": False,
                "time_duration_hours": 1,
                "native_price": 0,
                "schedule": {},
            }
        ],
        "clustering": {
            "0": {
                "place_ids": [1],
                "stats": {"avg_score": 10, "mandatory_count": 0},
            }
        },
        "centroid": {
            "avg_lat": 19.0,
            "avg_long": 72.0,
            "values": {"0": {"lat": 19.0, "long": 72.0}},
        },
    }


class TripTaskFlowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        main.app.config.update(
            TESTING=True,
            LOGIN_DISABLED=False,
        )
        with main.app.app_context():
            engine_path = Path(main.db.engine.url.database).resolve()
            if engine_path != TEST_DATABASE_PATH.resolve():
                raise AssertionError(
                    "Backend tests must use their isolated temporary database."
                )
            main.db.create_all()

    @classmethod
    def tearDownClass(cls):
        with main.app.app_context():
            main.db.session.remove()
            main.db.drop_all()
            main.db.engine.dispose()
        TEST_DATABASE_DIRECTORY.cleanup()

    def setUp(self):
        with main.app.app_context():
            main.db.session.remove()
            main.db.drop_all()
            main.db.create_all()
            user = main.User(name="Test User", email="test@example.com")
            user.set_password("test-password")
            main.db.session.add(user)
            main.db.session.commit()

        self.client = main.app.test_client()
        response = self.client.post(
            "/login",
            json={"email": "test@example.com", "password": "test-password"},
        )
        self.assertEqual(response.status_code, 200)

    def make_trip(self, destination="Mumbai", budget_type=None):
        payload = {
            "origin_city": "Delhi",
            "destination_city": destination,
            "start_date": "2026-11-01",
            "end_date": "2026-11-02",
            "budget_type": budget_type,
            "budget_amount": 50000,
            "num_people": 2,
            "preferences": ["history"],
            "dislikes": [],
            "mandatory_places": [],
            "food_preference": "Any",
            "pace": "Moderate",
        }

        def queue_task(args, task_id):
            trip = main.Trip.query.order_by(main.Trip.id.desc()).first()
            self.assertIsNotNone(trip)
            return Mock(id=task_id)

        with (
            patch.object(main.perform_clustering, "apply_async", side_effect=queue_task),
            patch.object(main.get_travel_cost, "apply_async", side_effect=queue_task),
        ):
            response = self.client.post("/create_trip", json=payload)
        self.assertEqual(response.status_code, 201, response.get_json())
        return response.get_json()

    def test_signup_returns_user_and_session_endpoint_restores_it(self):
        client = main.app.test_client()
        signup = client.post(
            "/signup",
            json={
                "name": "Demo Traveler",
                "email": "demo-traveler@example.com",
                "password": "demo-password",
            },
        )

        self.assertEqual(signup.status_code, 201, signup.get_json())
        user = signup.get_json()["user"]
        self.assertEqual(user["email"], "demo-traveler@example.com")
        self.assertIsInstance(user["id"], int)

        session = client.get("/me")
        self.assertEqual(session.status_code, 200)
        self.assertEqual(session.get_json()["user"], user)

        anonymous_session = main.app.test_client().get("/me")
        self.assertEqual(anonymous_session.status_code, 200)
        self.assertIsNone(anonymous_session.get_json()["user"])

    def test_auth_routes_allow_credentialed_cors_for_vite_origins(self):
        origins = ("http://127.0.0.1:5174", "http://localhost:5174")
        for origin in origins:
            for path, method in (
                ("/me", "GET"),
                ("/login", "POST"),
                ("/signup", "POST"),
            ):
                with self.subTest(origin=origin, path=path):
                    preflight = self.client.options(
                        path,
                        headers={
                            "Origin": origin,
                            "Access-Control-Request-Method": method,
                            "Access-Control-Request-Headers": "content-type",
                        },
                    )
                    self.assertEqual(
                        preflight.headers.get("Access-Control-Allow-Origin"), origin
                    )
                    self.assertEqual(
                        preflight.headers.get("Access-Control-Allow-Credentials"),
                        "true",
                    )
                    self.assertIn(
                        method,
                        preflight.headers.get("Access-Control-Allow-Methods", ""),
                    )
                    self.assertIn(
                        "content-type",
                        preflight.headers.get(
                            "Access-Control-Allow-Headers", ""
                        ).lower(),
                    )

            session = self.client.get("/me", headers={"Origin": origin})
            self.assertEqual(
                session.headers.get("Access-Control-Allow-Origin"), origin
            )
            self.assertEqual(
                session.headers.get("Access-Control-Allow-Credentials"), "true"
            )

            login = self.client.post(
                "/login",
                json={"email": "test@example.com", "password": "test-password"},
                headers={"Origin": origin},
            )
            self.assertEqual(login.status_code, 200)
            self.assertEqual(login.headers.get("Access-Control-Allow-Origin"), origin)
            self.assertEqual(
                login.headers.get("Access-Control-Allow-Credentials"), "true"
            )

            signup = self.client.post(
                "/signup",
                json={
                    "name": "CORS Traveler",
                    "email": f"cors-{origin.split('//')[1].replace('.', '-').replace(':', '-')}"
                    "@example.com",
                    "password": "cors-password",
                },
                headers={"Origin": origin},
            )
            self.assertEqual(signup.status_code, 201, signup.get_json())
            self.assertEqual(signup.headers.get("Access-Control-Allow-Origin"), origin)
            self.assertEqual(
                signup.headers.get("Access-Control-Allow-Credentials"), "true"
            )

    @staticmethod
    def async_result(state, value=None):
        result = Mock()
        result.state = state
        result.result = value
        return result

    @staticmethod
    def set_work_result(created, workflow, state, result=None, error=None):
        status = {
            "QUEUED": "PENDING",
            "RUNNING": "STARTED",
            "SUCCEEDED": "SUCCESS",
            "FAILED": "FAILURE",
            "RESULT_UNAVAILABLE": "RESULT_UNAVAILABLE",
        }[state]
        with main.app.app_context():
            trip = main.db.session.get(main.Trip, created["trip_id"])
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow=workflow,
            ).one()
            work.state = state
            work.result = result
            work.error_message = error
            if state in {"SUCCEEDED", "FAILED", "RESULT_UNAVAILABLE"}:
                work.completed_at = main.utc_now()
                work.lease_expires_at = None
            if workflow in {"clustering", "budget"}:
                setattr(trip, f"{workflow}_status", status)
                setattr(trip, f"{workflow}_error", error)
            main.db.session.commit()

    @staticmethod
    def trip_endpoint_payload(endpoint, trip_id):
        payloads = {
            "delete": {},
            "hotel_choice": {
                "hotel_name": "Owner Hotel",
                "hotel_address": "Mumbai",
                "hotel_lat": 19.0,
                "hotel_long": 72.0,
                "hotel_price": 120.0,
            },
            "update_transport": {
                "needs_transport": True,
                "transport_type": "Economy",
            },
            "update_accomodation": {"needs_accommodation": False},
            "up_transport_choice": {
                "up_mode": "flight",
                "up_mode_id": "outbound-1",
            },
            "down_transport_choice": {
                "down_mode": "train",
                "down_mode_id": "return-1",
            },
            "transport_option": {"u_d": "u"},
        }
        return {"trip_id": trip_id, **payloads[endpoint]}

    def call_trip_endpoint(self, client, endpoint, trip_id):
        routes = {
            "delete": ("POST", "/delete_trip"),
            "hotel_choice": ("POST", "/hotel_choice"),
            "update_transport": ("POST", "/update_transport"),
            "update_accomodation": ("POST", "/update_accomodation"),
            "up_transport_choice": ("POST", "/up_transport_choice"),
            "down_transport_choice": ("POST", "/down_transport_choice"),
            "transport_option": ("POST", "/transport_option"),
        }
        method, path = routes[endpoint]
        payload = self.trip_endpoint_payload(endpoint, trip_id)

        if endpoint != "transport_option":
            return client.open(path, method=method, json=payload)

        empty_transport = main.pd.DataFrame(
            columns=[
                "source_city",
                "destination_city",
                "available_seats",
                "departure_date",
                "price",
                "bus_id",
                "train_id",
                "flight_id",
            ]
        )
        with ExitStack() as stack:
            for name in ("bus", "train", "flight"):
                stack.enter_context(
                    patch.object(main, name, empty_transport.copy())
                )
            return client.open(path, method=method, json=payload)

    def other_user_client(self):
        with main.app.app_context():
            other_user = main.User(
                name="Other User",
                email="other@example.com",
            )
            other_user.set_password("other-password")
            main.db.session.add(other_user)
            main.db.session.commit()

        client = main.app.test_client()
        response = client.post(
            "/login",
            json={
                "email": "other@example.com",
                "password": "other-password",
            },
        )
        self.assertEqual(response.status_code, 200)
        return client

    def test_trip_mutation_and_read_endpoints_allow_owner_operations(self):
        endpoints = (
            "delete",
            "hotel_choice",
            "update_transport",
            "update_accomodation",
            "up_transport_choice",
            "down_transport_choice",
            "transport_option",
        )
        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint):
                created = self.make_trip()
                trip_id = created["trip_id"]
                response = self.call_trip_endpoint(
                    self.client,
                    endpoint,
                    trip_id,
                )
                self.assertEqual(response.status_code, 200, response.get_json())

                with main.app.app_context():
                    trip = main.db.session.get(main.Trip, trip_id)
                    if endpoint == "delete":
                        self.assertIsNone(trip)
                        continue
                    self.assertIsNotNone(trip)
                    if endpoint == "hotel_choice":
                        self.assertEqual(trip.hotel_name, "Owner Hotel")
                    elif endpoint == "update_transport":
                        self.assertTrue(trip.needs_transport)
                        self.assertEqual(trip.transport_type, "Economy")
                    elif endpoint == "update_accomodation":
                        self.assertFalse(trip.needs_accommodation)
                    elif endpoint == "up_transport_choice":
                        self.assertEqual(trip.up_mode_id, "outbound-1")
                    elif endpoint == "down_transport_choice":
                        self.assertEqual(trip.down_mode_id, "return-1")

    def test_trip_endpoints_reject_other_users_without_changing_owner_trip(self):
        other_client = self.other_user_client()
        endpoints = (
            "delete",
            "hotel_choice",
            "update_transport",
            "update_accomodation",
            "up_transport_choice",
            "down_transport_choice",
            "transport_option",
        )
        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint):
                created = self.make_trip()
                trip_id = created["trip_id"]
                with main.app.app_context():
                    trip = main.db.session.get(main.Trip, trip_id)
                    before = {
                        "user_id": trip.user_id,
                        "needs_transport": trip.needs_transport,
                        "transport_type": trip.transport_type,
                        "needs_accommodation": trip.needs_accommodation,
                        "hotel_name": trip.hotel_name,
                        "hotel_address": trip.hotel_address,
                        "hotel_lat": trip.hotel_lat,
                        "hotel_long": trip.hotel_long,
                        "hotel_price": trip.hotel_price,
                        "up_mode_id": trip.up_mode_id,
                        "down_mode_id": trip.down_mode_id,
                    }

                response = self.call_trip_endpoint(
                    other_client,
                    endpoint,
                    trip_id,
                )
                self.assertEqual(response.status_code, 404, response.get_json())
                self.assertNotIn(
                    "destination_city",
                    response.get_json(),
                )
                with main.app.app_context():
                    trip = main.db.session.get(main.Trip, trip_id)
                    self.assertIsNotNone(trip)
                    self.assertEqual(
                        {key: getattr(trip, key) for key in before},
                        before,
                    )

    def test_trip_endpoints_handle_missing_and_nonexistent_ids(self):
        endpoints = (
            "delete",
            "hotel_choice",
            "update_transport",
            "update_accomodation",
            "up_transport_choice",
            "down_transport_choice",
            "transport_option",
        )
        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint):
                method, path = {
                    "delete": ("POST", "/delete_trip"),
                    "hotel_choice": ("POST", "/hotel_choice"),
                    "update_transport": ("POST", "/update_transport"),
                    "update_accomodation": ("POST", "/update_accomodation"),
                    "up_transport_choice": ("POST", "/up_transport_choice"),
                    "down_transport_choice": ("POST", "/down_transport_choice"),
                    "transport_option": ("POST", "/transport_option"),
                }[endpoint]
                missing = self.client.open(path, method=method, json={})
                self.assertEqual(missing.status_code, 400)

                nonexistent = self.call_trip_endpoint(
                    self.client,
                    endpoint,
                    999999,
                )
                self.assertEqual(nonexistent.status_code, 404)

    def test_two_trips_keep_independent_task_ids_and_results(self):
        first = self.make_trip("Mumbai")
        second = self.make_trip("Hyderabad")
        first_id = first["tasks"]["clustering"]["task_id"]
        second_id = second["tasks"]["clustering"]["task_id"]
        self.assertNotEqual(first_id, second_id)

        result_by_id = {
            first_id: valid_clustering_result("Mumbai landmark"),
            second_id: valid_clustering_result("Hyderabad landmark"),
        }
        for created in (first, second):
            with main.app.app_context():
                trip = main.db.session.get(main.Trip, created["trip_id"])
                trip.accommodation_type = "Standard"
                main.db.session.commit()
            self.set_work_result(
                created,
                "clustering",
                "SUCCEEDED",
                result_by_id[created["tasks"]["clustering"]["task_id"]],
            )

        with (
            patch.object(
                main.hotels,
                "get_hotels_near",
                return_value=[
                    {
                        "hotel_name": "Test Hotel",
                        "hotel_id": "hotel-1",
                        "latitude": 19.0,
                        "longitude": 72.0,
                        "address": "Test address",
                        "price": 100,
                        "currency": "INR",
                    }
                ],
            ),
            patch.object(main, "get_price_limit_hotels", return_value=1000),
        ):
            def request_hotels(created):
                client = main.app.test_client()
                client.post(
                    "/login",
                    json={
                        "email": "test@example.com",
                        "password": "test-password",
                    },
                )
                return client.post(
                    "/hotel_option", json={"trip_id": created["trip_id"]}
                )

            with ThreadPoolExecutor(max_workers=2) as executor:
                responses = list(executor.map(request_hotels, (first, second)))

        for created, response in zip((first, second), responses):
            self.assertEqual(response.status_code, 200, response.get_json())
            saved_place_name = response.get_json()["tasks"]["Places"][0]["name"]
            self.assertEqual(
                saved_place_name,
                result_by_id[
                    created["tasks"]["clustering"]["task_id"]
                ]["Places"][0]["name"],
            )

    def test_pending_clustering_returns_202_from_hotel_and_solver(self):
        created = self.make_trip()
        with patch.object(
            main,
            "AsyncResult",
            return_value=self.async_result("STARTED"),
        ):
            hotel_response = self.client.post(
                "/hotel_option", json={"trip_id": created["trip_id"]}
            )
            solver_response = self.client.post(
                "/ilp_solver", json={"trip_id": created["trip_id"]}
            )

        self.assertEqual(hotel_response.status_code, 202)
        self.assertEqual(hotel_response.get_json()["status"], "processing")
        self.assertEqual(solver_response.status_code, 202)
        self.assertEqual(solver_response.get_json()["status"], "processing")

    def test_budget_results_are_scoped_to_each_trip_task_id(self):
        first = self.make_trip("Mumbai", budget_type="Basic")
        second = self.make_trip("Hyderabad", budget_type="Basic")
        budget_ids = {
            first["tasks"]["budget"]["task_id"]: {"final_cost": 1200},
            second["tasks"]["budget"]["task_id"]: {"final_cost": 2400},
        }
        self.assertNotEqual(*budget_ids.keys())

        for created in (first, second):
            self.set_work_result(
                created,
                "budget",
                "SUCCEEDED",
                budget_ids[created["tasks"]["budget"]["task_id"]],
            )
            with main.app.app_context():
                trip = main.db.session.get(main.Trip, created["trip_id"])
                _, _, budget_result = main._trip_task_status(trip)
            self.assertEqual(
                budget_result["final_cost"],
                budget_ids[created["tasks"]["budget"]["task_id"]]["final_cost"],
            )

    def test_failed_budget_task_is_reported_by_status_and_solver(self):
        created = self.make_trip("Mumbai", budget_type="Basic")
        clustering_result = valid_clustering_result("Mumbai landmark")

        self.set_work_result(
            created,
            "clustering",
            "SUCCEEDED",
            clustering_result,
        )
        self.set_work_result(
            created,
            "budget",
            "FAILED",
            error="budget provider unavailable",
        )
        status_response = self.client.get(
            f"/trip/{created['trip_id']}/status"
        )
        solver_response = self.client.post(
            "/ilp_solver", json={"trip_id": created["trip_id"]}
        )

        self.assertEqual(status_response.get_json()["status"], "failed")
        self.assertEqual(
            status_response.get_json()["tasks"]["budget"]["status"],
            "FAILURE",
        )
        self.assertEqual(solver_response.status_code, 500)
        self.assertEqual(solver_response.get_json()["status"], "failed")
        self.assertIn(
            "budget provider unavailable",
            solver_response.get_json()["details"],
        )

    def test_successful_clustering_flows_through_solver_persistence_and_get(self):
        created = self.make_trip()
        clustering_result = valid_clustering_result("Mumbai landmark")
        with main.app.app_context():
            trip = main.db.session.get(main.Trip, created["trip_id"])
            trip.hotel_name = "Test Hotel"
            trip.hotel_lat = 19.0
            trip.hotel_long = 72.0
            main.db.session.commit()

        schedule = {
            "timeline": {
                "09:00 AM-10:00 AM": {
                    "id": 1,
                    "name": "Mumbai landmark",
                    "latitude": 19.0,
                    "longitude": 72.0,
                    "time_duration_hours": 1.0,
                    "start_time": "09:00 AM",
                }
            },
            "restaurants": [],
        }
        self.set_work_result(
            created,
            "clustering",
            "SUCCEEDED",
            clustering_result,
        )
        with (
            patch.object(
                main.ilp_sol,
                "generate_itinerary",
                return_value=(schedule, []),
            ) as run_ilp,
        ):
            solver_response = self.client.post(
                "/ilp_solver",
                json={"trip_id": created["trip_id"]},
            )
            itinerary_response = self.client.get(
                f"/itinerary/{created['trip_id']}"
            )
            repeated_solver_response = self.client.post(
                "/ilp_solver",
                json={"trip_id": created["trip_id"]},
            )

        self.assertEqual(solver_response.status_code, 200, solver_response.get_json())
        self.assertEqual(repeated_solver_response.status_code, 200)
        self.assertIn("2026-11-01", solver_response.get_json())
        run_ilp.assert_called_once()

        with main.app.app_context():
            trip = main.db.session.get(main.Trip, created["trip_id"])
            saved = main.Itinerary.query.filter_by(
                trip_id=created["trip_id"]
            ).first()
            self.assertEqual(trip.itinerary_status, "SUCCESS")
            self.assertIsNotNone(saved)
            self.assertEqual(
                saved.daily_plan["2026-11-01"]["places"][0]["name"],
                "Mumbai landmark",
            )
            saved_daily_plan = copy.deepcopy(saved.daily_plan)

        self.assertEqual(itinerary_response.status_code, 200)
        self.assertEqual(
            itinerary_response.get_json(),
            {
                "exists": True,
                "status": "completed",
                "itinerary": saved_daily_plan,
            },
        )

    def test_persisted_clustering_task_stores_its_durable_result(self):
        created = self.make_trip()
        task_id = created["tasks"]["clustering"]["task_id"]
        input_data = {
            "places": [
                {
                    "id": 1,
                    "name": "Mumbai landmark",
                    "is_mandatory": False,
                    "latitude": 19.0,
                    "longitude": 72.0,
                    "smart_score": 10.0,
                    "time_duration_hours": 1.0,
                    "schedule": {},
                }
            ]
        }
        clusterer = Mock()
        clusterer.fit_predict.return_value = [0]
        clusterer.cluster_centers_ = tasks.np.array([[19.0, 72.0]])

        with (
            patch.object(
                tasks.poi_get,
                "run_travel_planner_external",
                return_value=input_data,
            ),
            patch.object(tasks, "KMeansConstrained", return_value=clusterer),
        ):
            result = tasks.perform_clustering.run(
                "Mumbai",
                1,
                [],
                [],
                [],
                trip_id=created["trip_id"],
                generation=1,
                work_task_id=task_id,
            )

        self.assertIs(validate_clustering_result(result), result)
        with main.app.app_context():
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="clustering",
            ).one()
            self.assertEqual(work.state, "SUCCEEDED")
            self.assertEqual(work.result, result)
            trip = main.db.session.get(main.Trip, created["trip_id"])
            self.assertEqual(trip.clustering_status, "SUCCESS")

    def test_expired_worker_is_requeued_and_old_generation_is_fenced(self):
        created = self.make_trip()
        task_id = created["tasks"]["clustering"]["task_id"]
        now = workflow_ledger.utc_now()
        with main.app.app_context():
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="clustering",
            ).one()
            work.state = "RUNNING"
            work.attempt_count = 1
            work.started_at = now - timedelta(minutes=5)
            work.heartbeat_at = now - timedelta(minutes=5)
            work.lease_expires_at = now - timedelta(minutes=1)
            main.db.session.commit()

            recovered = workflow_dispatcher.recover_expired_work(
                main,
                now,
            )
            self.assertEqual(recovered, 1)
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="clustering",
            ).one()
            new_generation = work.generation
            new_task_id = work.celery_task_id
            self.assertEqual(work.state, "QUEUED")
            self.assertEqual(new_generation, 2)
            self.assertNotEqual(new_task_id, task_id)

            self.assertTrue(
                workflow_ledger.claim_task(
                    created["trip_id"],
                    "clustering",
                    new_task_id,
                    new_generation,
                )
            )
            result = valid_clustering_result("Mumbai landmark")
            self.assertFalse(
                workflow_ledger.complete_work(
                    created["trip_id"],
                    "clustering",
                    1,
                    task_id,
                    result,
                )
            )
            self.assertTrue(
                workflow_ledger.complete_work(
                    created["trip_id"],
                    "clustering",
                    new_generation,
                    new_task_id,
                    result,
                )
            )

    def test_expired_worker_cannot_heartbeat_complete_or_fail_before_recovery(self):
        created = self.make_trip()
        task_id = created["tasks"]["clustering"]["task_id"]
        with main.app.app_context():
            self.assertTrue(
                workflow_ledger.claim_task(
                    created["trip_id"],
                    "clustering",
                    task_id,
                    1,
                )
            )
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="clustering",
            ).one()
            work.lease_expires_at = (
                workflow_ledger.utc_now() - timedelta(seconds=1)
            )
            main.db.session.commit()

            self.assertFalse(
                workflow_ledger.heartbeat(
                    created["trip_id"], "clustering", 1, task_id
                )
            )
            self.assertFalse(
                workflow_ledger.complete_work(
                    created["trip_id"],
                    "clustering",
                    1,
                    task_id,
                    valid_clustering_result("stale result"),
                )
            )
            self.assertFalse(
                workflow_ledger.fail_work(
                    created["trip_id"],
                    "clustering",
                    1,
                    task_id,
                    "late failure",
                )
            )
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="clustering",
            ).one()
            self.assertEqual(work.state, "RUNNING")
            self.assertIsNone(work.result)

    def test_expired_solver_cannot_finish_or_fail_before_recovery(self):
        created = self.make_trip()
        with main.app.app_context():
            state, generation = workflow_ledger.claim_solver(
                created["trip_id"], "expired-solver"
            )
            self.assertEqual(state, "CLAIMED")
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="itinerary",
            ).one()
            work.lease_expires_at = (
                workflow_ledger.utc_now() - timedelta(seconds=1)
            )
            main.db.session.commit()

            plan = {"2026-11-01": {"places": []}}
            self.assertFalse(
                workflow_ledger.finish_solver(
                    created["trip_id"],
                    generation,
                    "expired-solver",
                    plan,
                )
            )
            self.assertFalse(
                workflow_ledger.fail_solver(
                    created["trip_id"],
                    generation,
                    "expired-solver",
                    "late solver failure",
                )
            )
            self.assertIsNone(
                main.Itinerary.query.filter_by(
                    trip_id=created["trip_id"]
                ).first()
            )
            self.assertEqual(work.state, "RUNNING")

    def test_expired_solver_claim_is_reclaimed_and_late_save_is_fenced(self):
        created = self.make_trip()
        with main.app.app_context():
            state, old_generation = workflow_ledger.claim_solver(
                created["trip_id"],
                "old-solver-task",
            )
            self.assertEqual(state, "CLAIMED")

            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="itinerary",
            ).one()
            work.lease_expires_at = (
                workflow_ledger.utc_now() - timedelta(minutes=1)
            )
            main.db.session.commit()

            state, new_generation = workflow_ledger.claim_solver(
                created["trip_id"],
                "new-solver-task",
            )
            self.assertEqual(state, "CLAIMED")
            self.assertGreater(new_generation, old_generation)

            old_plan = {"2026-11-01": {"places": [{"name": "old"}]}}
            new_plan = {"2026-11-01": {"places": [{"name": "new"}]}}
            self.assertFalse(
                workflow_ledger.finish_solver(
                    created["trip_id"],
                    old_generation,
                    "old-solver-task",
                    old_plan,
                )
            )
            self.assertTrue(
                workflow_ledger.finish_solver(
                    created["trip_id"],
                    new_generation,
                    "new-solver-task",
                    new_plan,
                )
            )
            saved = main.Itinerary.query.filter_by(
                trip_id=created["trip_id"]
            ).one()
            self.assertEqual(saved.daily_plan, new_plan)

    def test_expired_solver_at_attempt_limit_becomes_terminal(self):
        created = self.make_trip()
        with main.app.app_context():
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="itinerary",
            ).one()
            work.state = "RUNNING"
            work.generation = 7
            work.celery_task_id = "last-solver-attempt"
            work.attempt_count = workflow_ledger.MAX_WORK_ATTEMPTS
            work.lease_expires_at = (
                workflow_ledger.utc_now() - timedelta(seconds=1)
            )
            main.db.session.commit()

            claim, generation = workflow_ledger.claim_solver(
                created["trip_id"], "must-not-claim"
            )
            self.assertEqual(claim, "FAILED")
            self.assertEqual(generation, 7)
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="itinerary",
            ).one()
            trip = main.db.session.get(main.Trip, created["trip_id"])
            self.assertEqual(work.state, "FAILED")
            self.assertEqual(work.error_code, "SOLVER_MAX_ATTEMPTS")
            self.assertEqual(trip.itinerary_status, "FAILURE")
            self.assertEqual(
                trip.itinerary_error,
                workflow_ledger.SOLVER_ATTEMPTS_EXHAUSTED_MESSAGE,
            )

    def test_concurrent_solver_claims_near_limit_use_one_final_attempt(self):
        created = self.make_trip()
        with main.app.app_context():
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="itinerary",
            ).one()
            work.state = "FAILED"
            work.generation = 3
            work.attempt_count = workflow_ledger.MAX_WORK_ATTEMPTS - 1
            work.error_code = "SOLVER_FAILED"
            main.db.session.commit()

        barrier = Barrier(2)

        def claim(task_id):
            with main.app.app_context():
                barrier.wait(timeout=5)
                return workflow_ledger.claim_solver(
                    created["trip_id"], task_id
                )

        with ThreadPoolExecutor(max_workers=2) as executor:
            claims = list(
                executor.map(claim, ("final-claim-a", "final-claim-b"))
            )
        self.assertEqual(sum(state == "CLAIMED" for state, _ in claims), 1)
        self.assertEqual(sum(state == "RUNNING" for state, _ in claims), 1)
        with main.app.app_context():
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="itinerary",
            ).one()
            self.assertEqual(
                work.attempt_count,
                workflow_ledger.MAX_WORK_ATTEMPTS,
            )

    def test_solver_attempt_limit_is_visible_and_not_reclaimable(self):
        created = self.make_trip()
        with main.app.app_context():
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="itinerary",
            ).one()
            work.state = "RUNNING"
            work.generation = 5
            work.celery_task_id = "expired-final-attempt"
            work.attempt_count = workflow_ledger.MAX_WORK_ATTEMPTS
            work.lease_expires_at = (
                workflow_ledger.utc_now() - timedelta(seconds=1)
            )
            trip = main.db.session.get(main.Trip, created["trip_id"])
            trip.itinerary_status = "PROCESSING"
            main.db.session.commit()

        itinerary = self.client.get(f"/itinerary/{created['trip_id']}")
        self.assertEqual(itinerary.status_code, 500)
        self.assertEqual(
            itinerary.get_json()["reason"],
            "solver_attempts_exhausted",
        )
        with main.app.app_context():
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="itinerary",
            ).one()
            self.assertEqual(work.state, "FAILED")
            self.assertEqual(work.error_code, "SOLVER_MAX_ATTEMPTS")
            self.assertEqual(
                main.db.session.get(main.Trip, created["trip_id"]).itinerary_status,
                "FAILURE",
            )
        with patch.object(main.ilp_sol, "generate_itinerary") as run_ilp:
            retry = self.client.post(
                "/ilp_solver", json={"trip_id": created["trip_id"]}
            )
        self.assertEqual(retry.status_code, 500)
        self.assertEqual(
            retry.get_json()["reason"],
            "solver_attempts_exhausted",
        )
        run_ilp.assert_not_called()
        with main.app.app_context():
            state, _ = workflow_ledger.claim_solver(
                created["trip_id"], "manual-bypass"
            )
        self.assertEqual(state, "FAILED")

    def test_independent_sqlite_connections_atomically_claim_solver_once(self):
        created = self.make_trip()
        barrier = Barrier(2)

        def claim(task_id):
            with main.app.app_context():
                barrier.wait(timeout=5)
                return workflow_ledger.claim_solver(
                    created["trip_id"],
                    task_id,
                )

        with ThreadPoolExecutor(max_workers=2) as executor:
            claims = list(
                executor.map(claim, ("solver-one", "solver-two"))
            )

        self.assertEqual(
            sum(state == "CLAIMED" for state, _ in claims),
            1,
        )
        self.assertEqual(
            sum(state == "RUNNING" for state, _ in claims),
            1,
        )

    def test_duplicate_task_delivery_has_one_atomic_claim(self):
        created = self.make_trip()
        task_id = created["tasks"]["clustering"]["task_id"]
        with main.app.app_context():
            self.assertTrue(
                workflow_ledger.claim_task(
                    created["trip_id"],
                    "clustering",
                    task_id,
                    1,
                )
            )
            self.assertFalse(
                workflow_ledger.claim_task(
                    created["trip_id"],
                    "clustering",
                    task_id,
                    1,
                )
            )
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="clustering",
            ).one()
            self.assertEqual(work.attempt_count, 1)

    def test_dispatcher_publishes_durable_task_identity(self):
        created = self.make_trip()
        task_id = created["tasks"]["clustering"]["task_id"]
        with (
            patch.object(
                main.perform_clustering,
                "apply_async",
                return_value=Mock(id=task_id),
            ) as publish,
            self.assertLogs("workflow_dispatcher", level="INFO") as dispatcher_logs,
            self.assertLogs("main", level="INFO") as publication_logs,
        ):
            dispatched = workflow_dispatcher.dispatch_queued_work()

        self.assertEqual(dispatched, 1)
        publish.assert_called_once()
        call = publish.call_args
        self.assertEqual(call.kwargs["task_id"], task_id)
        self.assertEqual(call.kwargs["kwargs"]["trip_id"], created["trip_id"])
        self.assertEqual(call.kwargs["kwargs"]["generation"], 1)
        self.assertEqual(call.kwargs["kwargs"]["work_task_id"], task_id)
        self.assertIn("Claimed workflow dispatch", "\n".join(dispatcher_logs.output))
        self.assertIn("tasks.perform_clustering", "\n".join(publication_logs.output))
        self.assertIn(task_id, "\n".join(publication_logs.output))

    def test_dispatch_failure_is_retried_and_redacted(self):
        created = self.make_trip()
        fake_secret = "dispatcher-secret-321"
        with (
            patch.dict(os.environ, {"REDIS_PASSWORD": fake_secret}),
            patch.object(
                main.perform_clustering,
                "apply_async",
                side_effect=RuntimeError(
                    "broker failed at redis://user:"
                    f"{fake_secret}@localhost/0"
                ),
            ),
            self.assertLogs("workflow_dispatcher", level="ERROR") as captured_logs,
        ):
            dispatched = workflow_dispatcher.dispatch_queued_work()

        self.assertEqual(dispatched, 0)
        log_output = "\n".join(captured_logs.output)
        self.assertNotIn(fake_secret, log_output)
        self.assertIn("[REDACTED]", log_output)
        with main.app.app_context():
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="clustering",
            ).one()
            self.assertEqual(work.state, "QUEUED")
            self.assertEqual(work.error_code, "DISPATCH_FAILED")
            self.assertEqual(work.dispatch_attempt_count, 1)
            self.assertNotIn(fake_secret, work.error_message)

    def test_dispatch_attempt_is_counted_when_publication_fails_before_acceptance(self):
        created = self.make_trip()
        with patch.object(
            main.perform_clustering,
            "apply_async",
            side_effect=RuntimeError("connection refused before publish"),
        ):
            workflow_dispatcher.dispatch_queued_work()

        with main.app.app_context():
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="clustering",
            ).one()
            self.assertEqual(work.dispatch_attempt_count, 1)
            self.assertEqual(work.state, "QUEUED")

    def test_ambiguous_acknowledgements_count_and_eventually_fail(self):
        created = self.make_trip()
        accepted_task_ids = []

        def accept_then_raise(*_args, task_id, **_kwargs):
            accepted_task_ids.append(task_id)
            raise RuntimeError("acknowledgement lost after broker acceptance")

        for attempt in range(workflow_dispatcher.MAX_DISPATCH_ATTEMPTS):
            with patch.object(
                main.perform_clustering,
                "apply_async",
                side_effect=accept_then_raise,
            ):
                workflow_dispatcher.dispatch_queued_work()
            with main.app.app_context():
                work = main.TripWork.query.filter_by(
                    trip_id=created["trip_id"],
                    workflow="clustering",
                ).one()
                if work.state == "QUEUED":
                    work.next_attempt_at = (
                        workflow_ledger.utc_now() - timedelta(seconds=1)
                    )
                    main.db.session.commit()
            if attempt + 1 < workflow_dispatcher.MAX_DISPATCH_ATTEMPTS:
                with main.app.app_context():
                    work = main.TripWork.query.filter_by(
                        trip_id=created["trip_id"],
                        workflow="clustering",
                    ).one()
                    work.dispatch_lease_until = None
                    main.db.session.commit()

        self.assertEqual(
            len(accepted_task_ids),
            workflow_dispatcher.MAX_DISPATCH_ATTEMPTS,
        )
        self.assertEqual(len(set(accepted_task_ids)), 1)
        with main.app.app_context():
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="clustering",
            ).one()
            self.assertEqual(work.state, "FAILED")
            self.assertEqual(
                work.dispatch_attempt_count,
                workflow_dispatcher.MAX_DISPATCH_ATTEMPTS,
            )
            self.assertEqual(
                work.error_code,
                "DISPATCH_FAILED_MAX_ATTEMPTS",
            )

    def test_crash_after_final_reservation_becomes_terminal_after_lease(self):
        created = self.make_trip()
        with main.app.app_context():
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="clustering",
            ).one()
            work.dispatch_attempt_count = (
                workflow_dispatcher.MAX_DISPATCH_ATTEMPTS
            )
            work.dispatch_lease_until = (
                workflow_ledger.utc_now() - timedelta(seconds=1)
            )
            main.db.session.commit()

        with patch.object(main.perform_clustering, "apply_async") as publish:
            workflow_dispatcher.dispatch_queued_work()
        publish.assert_not_called()
        response = self.client.get(f"/trip/{created['trip_id']}/status")
        self.assertEqual(
            response.get_json()["tasks"]["clustering"]["status"],
            "FAILURE",
        )
        self.assertIn(
            "publication attempt limit",
            response.get_json()["tasks"]["clustering"]["error"],
        )

    def test_repeated_dispatch_failure_is_terminal_and_explicitly_retryable(self):
        created = self.make_trip()
        for _ in range(workflow_dispatcher.MAX_DISPATCH_ATTEMPTS):
            with patch.object(
                main.perform_clustering,
                "apply_async",
                side_effect=RuntimeError("broker unavailable"),
            ):
                workflow_dispatcher.dispatch_queued_work()
            with main.app.app_context():
                work = main.TripWork.query.filter_by(
                    trip_id=created["trip_id"],
                    workflow="clustering",
                ).one()
                if work.state == "QUEUED":
                    work.next_attempt_at = workflow_ledger.utc_now() - timedelta(
                        seconds=1
                    )
                    work.dispatch_lease_until = None
                    main.db.session.commit()

        status_response = self.client.get(
            f"/trip/{created['trip_id']}/status"
        )
        task = status_response.get_json()["tasks"]["clustering"]
        self.assertEqual(task["status"], "FAILURE")
        self.assertIn("broker unavailable", task["error"])
        with main.app.app_context():
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="clustering",
            ).one()
            self.assertEqual(
                work.error_code,
                "DISPATCH_FAILED_MAX_ATTEMPTS",
            )

        old_task_id = task["task_id"]
        with patch.object(main.perform_clustering, "apply_async") as publish:
            retry_response = self.client.post(
                f"/trip/{created['trip_id']}/tasks/clustering/retry"
            )
        self.assertEqual(retry_response.status_code, 202)
        self.assertNotEqual(
            retry_response.get_json()["task"]["task_id"],
            old_task_id,
        )
        publish.assert_not_called()
        with main.app.app_context():
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="clustering",
            ).one()
            self.assertEqual(work.state, "QUEUED")
            self.assertEqual(work.dispatch_attempt_count, 0)

    def test_validation_cas_does_not_overwrite_a_concurrent_retry(self):
        created = self.make_trip()
        malformed = valid_clustering_result("Mumbai landmark")
        malformed["clustering"]["0"]["place_ids"] = [999]
        self.set_work_result(
            created,
            "clustering",
            "SUCCEEDED",
            malformed,
        )
        retry_identity = {"generation": None, "task_id": "retry-task"}

        def validate_then_retry(_result):
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="clustering",
            ).one()
            retry_identity["generation"] = work.generation + 1
            work.state = "QUEUED"
            work.generation = retry_identity["generation"]
            work.celery_task_id = retry_identity["task_id"]
            main.db.session.commit()
            raise ValueError("invalid old result")

        with patch.object(
            main,
            "validate_clustering_result",
            side_effect=validate_then_retry,
        ):
            response = self.client.get(
                f"/trip/{created['trip_id']}/status"
            )

        self.assertEqual(
            response.get_json()["tasks"]["clustering"]["status"],
            "PENDING",
        )
        with main.app.app_context():
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="clustering",
            ).one()
            self.assertEqual(work.state, "QUEUED")
            self.assertEqual(work.generation, retry_identity["generation"])
            self.assertEqual(work.celery_task_id, retry_identity["task_id"])

    def test_recorded_task_success_with_missing_celery_result_is_unavailable(self):
        created = self.make_trip()
        with main.app.app_context():
            trip = main.db.session.get(main.Trip, created["trip_id"])
        self.set_work_result(
            created,
            "clustering",
            "SUCCEEDED",
            None,
        )
        with main.app.app_context():
            trip = main.db.session.get(main.Trip, created["trip_id"])
            trip.clustering_status = "SUCCESS"
            main.db.session.commit()

        response = self.client.get(
            f"/trip/{created['trip_id']}/status"
        )
        hotel_response = self.client.post(
            "/hotel_option",
            json={"trip_id": created["trip_id"]},
        )
        solver_response = self.client.post(
            "/ilp_solver",
            json={"trip_id": created["trip_id"]},
        )

        clustering = response.get_json()["tasks"]["clustering"]
        self.assertEqual(clustering["status"], "RESULT_UNAVAILABLE")
        self.assertIn("result is unavailable", clustering["error"])
        self.assertEqual(response.get_json()["status"], "failed")
        self.assertEqual(hotel_response.status_code, 500)
        self.assertEqual(hotel_response.get_json()["status"], "failed")
        self.assertEqual(solver_response.status_code, 500)
        self.assertEqual(solver_response.get_json()["status"], "failed")

        with main.app.app_context():
            trip = main.db.session.get(main.Trip, created["trip_id"])
            self.assertEqual(trip.clustering_status, "RESULT_UNAVAILABLE")

    def test_redis_task_results_are_not_expired_by_celery_configuration(self):
        self.assertIsNone(tasks.celery.conf.result_expires)

    def test_malformed_clustering_result_is_rejected_by_hotel_and_solver(self):
        created = self.make_trip()
        malformed = valid_clustering_result("Mumbai landmark")
        malformed["clustering"]["0"]["place_ids"] = [999]
        self.set_work_result(
            created,
            "clustering",
            "SUCCEEDED",
            malformed,
        )
        hotel_response = self.client.post(
            "/hotel_option", json={"trip_id": created["trip_id"]}
        )
        solver_response = self.client.post(
            "/ilp_solver", json={"trip_id": created["trip_id"]}
        )

        self.assertEqual(hotel_response.status_code, 500)
        self.assertEqual(hotel_response.get_json()["status"], "failed")
        self.assertEqual(solver_response.status_code, 500)
        self.assertEqual(solver_response.get_json()["status"], "failed")

    def test_status_endpoint_redacts_secret_in_celery_failure(self):
        created = self.make_trip()
        secret = "fake-provider-secret-789"
        with main.app.app_context():
            main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="clustering",
            ).delete(synchronize_session=False)
            main.db.session.commit()
        with (
            patch.dict(os.environ, {"SERPAPI_KEY": secret}),
            patch.object(
                main,
                "AsyncResult",
                return_value=Mock(
                    state="FAILURE",
                    result=RuntimeError(
                        f"https://serpapi.test/search?api_key={secret}"
                    ),
                ),
            ),
        ):
            response = self.client.get(f"/trip/{created['trip_id']}/status")

        body = response.get_json()
        self.assertNotIn(secret, response.get_data(as_text=True))
        self.assertIn("[REDACTED]", body["tasks"]["clustering"]["error"])

    def test_chained_provider_secret_is_redacted_from_logs_and_status_response(self):
        created = self.make_trip()
        fake_secret = "chained-provider-secret-789"

        def raise_chained_error(*args, **kwargs):
            try:
                raise ValueError(
                    "provider URL "
                    f"https://provider.example/search?api_key={fake_secret}"
                )
            except ValueError as cause:
                raise RuntimeError("Provider request failed") from cause

        with (
            patch.dict(os.environ, {"SERPAPI_KEY": fake_secret}),
            patch.object(
                tasks.poi_get,
                "run_travel_planner_external",
                side_effect=raise_chained_error,
            ),
            self.assertLogs("tasks", level="ERROR") as captured_logs,
        ):
            with self.assertRaises(RuntimeError) as task_error:
                tasks.perform_clustering.run(
                    "Mumbai",
                    1,
                    [],
                    [],
                    [],
                    trip_id=created["trip_id"],
                    generation=1,
                    work_task_id=created["tasks"]["clustering"]["task_id"],
                )
            response = self.client.get(
                f"/trip/{created['trip_id']}/status"
            )

        log_output = "\n".join(captured_logs.output)
        self.assertNotIn(fake_secret, log_output)
        self.assertIn("[REDACTED]", log_output)
        self.assertNotIn(fake_secret, str(task_error.exception))
        self.assertNotIn(fake_secret, response.get_data(as_text=True))
        self.assertEqual(
            response.get_json()["tasks"]["clustering"]["error"],
            "Provider request failed",
        )

    def test_another_user_cannot_read_or_retry_a_trip_task(self):
        created = self.make_trip()
        with main.app.app_context():
            other_user = main.User(
                name="Other User",
                email="other@example.com",
            )
            other_user.set_password("other-password")
            main.db.session.add(other_user)
            main.db.session.commit()

        other_client = main.app.test_client()
        login_response = other_client.post(
            "/login",
            json={
                "email": "other@example.com",
                "password": "other-password",
            },
        )
        self.assertEqual(login_response.status_code, 200)

        with patch.object(main.perform_clustering, "apply_async") as enqueue:
            status_response = other_client.get(
                f"/trip/{created['trip_id']}/status"
            )
            retry_response = other_client.post(
                f"/trip/{created['trip_id']}/tasks/clustering/retry"
            )

        self.assertEqual(status_response.status_code, 404)
        self.assertEqual(retry_response.status_code, 404)
        enqueue.assert_not_called()

    def test_processing_itinerary_is_not_reset_by_status_reads(self):
        created = self.make_trip()
        with main.app.app_context():
            trip = main.db.session.get(main.Trip, created["trip_id"])
            trip.itinerary_status = "PROCESSING"
            main.db.session.commit()

        with patch.object(
            main,
            "AsyncResult",
            return_value=self.async_result("PENDING"),
        ):
            response = self.client.get(f"/itinerary/{created['trip_id']}")

        self.assertEqual(response.status_code, 202)
        with main.app.app_context():
            trip = main.db.session.get(main.Trip, created["trip_id"])
            self.assertEqual(trip.itinerary_status, "PROCESSING")

    def test_direct_entrypoint_itinerary_uses_registered_workflow_ledger_database(self):
        with tempfile.TemporaryDirectory(prefix="tripcraft-entrypoint-test-") as directory:
            database_uri = f"sqlite:///{Path(directory) / 'entrypoint.sqlite'}"
            with (
                patch.dict(os.environ, {"SQLALCHEMY_DATABASE_URI": database_uri}),
                patch("flask.Flask.run"),
                patch.dict(sys.modules, {"main": main}),
            ):
                runtime = runpy.run_path(
                    str(Path(main.__file__).resolve()),
                    run_name="__main__",
                )
                runtime_main = sys.modules["main"]
                runtime_app = runtime["app"]
                runtime_db = runtime["db"]
                try:
                    self.assertIs(runtime_main.app, runtime_app)
                    self.assertIs(
                        runtime_app.extensions["sqlalchemy"],
                        runtime_db,
                    )

                    with runtime_app.app_context():
                        user = runtime["User"](
                            name="Entrypoint User",
                            email="entrypoint@example.com",
                        )
                        user.set_password("test-password")
                        runtime_db.session.add(user)
                        runtime_db.session.flush()
                        trip = runtime["Trip"](
                            user_id=user.id,
                            origin_city="Delhi",
                            destination_city="Mumbai",
                            start_date=datetime(2026, 11, 1).date(),
                            end_date=datetime(2026, 11, 2).date(),
                            num_people=2,
                        )
                        runtime_db.session.add(trip)
                        runtime_db.session.commit()
                        trip_id = trip.id

                    client = runtime_app.test_client()
                    login = client.post(
                        "/login",
                        json={
                            "email": "entrypoint@example.com",
                            "password": "test-password",
                        },
                    )
                    self.assertEqual(login.status_code, 200, login.get_json())

                    response = client.get(f"/itinerary/{trip_id}")
                    self.assertEqual(response.status_code, 202, response.get_json())
                finally:
                    with runtime_app.app_context():
                        runtime_db.session.remove()
                        runtime_db.engine.dispose()

    def test_successful_empty_itinerary_is_returned_as_completed(self):
        created = self.make_trip()
        with main.app.app_context():
            trip = main.db.session.get(main.Trip, created["trip_id"])
            trip.itinerary_status = "SUCCESS"
            main.db.session.add(
                main.Itinerary(trip_id=trip.id, daily_plan={})
            )
            main.db.session.commit()

        with patch.object(
            main,
            "AsyncResult",
            return_value=self.async_result("PENDING"),
        ):
            response = self.client.get(f"/itinerary/{created['trip_id']}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {"exists": True, "status": "completed", "itinerary": {}},
        )

    def test_saved_itinerary_without_ledger_is_reconciled_idempotently(self):
        created = self.make_trip()
        plan = {
            "2026-11-01": {
                "day": "Sunday",
                "date": "2026-11-01",
                "places": [{"id": 1, "name": "Saved place"}],
                "meals": [],
            }
        }
        with main.app.app_context():
            trip = main.db.session.get(main.Trip, created["trip_id"])
            trip.itinerary_status = "SUCCESS"
            main.TripWork.query.filter_by(
                trip_id=trip.id,
                workflow="itinerary",
            ).delete(synchronize_session=False)
            main.db.session.add(
                main.Itinerary(trip_id=trip.id, daily_plan=plan)
            )
            main.db.session.commit()

        with patch.object(main.ilp_sol, "generate_itinerary") as run_ilp:
            first = self.client.get(
                f"/itinerary/{created['trip_id']}"
            )
            second = self.client.get(
                f"/itinerary/{created['trip_id']}"
            )
            solver = self.client.post(
                "/ilp_solver", json={"trip_id": created["trip_id"]}
            )

        expected = {
            "exists": True,
            "status": "completed",
            "itinerary": plan,
        }
        self.assertEqual(first.get_json(), expected)
        self.assertEqual(second.get_json(), expected)
        self.assertEqual(solver.status_code, 200)
        self.assertEqual(solver.get_json(), plan)
        run_ilp.assert_not_called()
        with main.app.app_context():
            work_rows = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="itinerary",
            ).all()
            self.assertEqual(len(work_rows), 1)
            self.assertEqual(work_rows[0].state, "SUCCEEDED")

    def test_polling_request_reclaims_expired_solver_and_fences_old_worker(self):
        created = self.make_trip()
        self.set_work_result(
            created,
            "clustering",
            "SUCCEEDED",
            valid_clustering_result("Mumbai landmark"),
        )
        with main.app.app_context():
            trip = main.db.session.get(main.Trip, created["trip_id"])
            trip.hotel_name = "Test Hotel"
            trip.hotel_lat = 19.0
            trip.hotel_long = 72.0
            state, old_generation = workflow_ledger.claim_solver(
                trip.id, "old-polling-solver"
            )
            self.assertEqual(state, "CLAIMED")
            work = main.TripWork.query.filter_by(
                trip_id=trip.id,
                workflow="itinerary",
            ).one()
            work.lease_expires_at = (
                workflow_ledger.utc_now() - timedelta(seconds=1)
            )
            main.db.session.commit()

        polling_response = self.client.get(
            f"/itinerary/{created['trip_id']}"
        )
        self.assertEqual(polling_response.status_code, 202)

        schedule = {"timeline": {}, "restaurants": []}
        with patch.object(
            main.ilp_sol,
            "generate_itinerary",
            return_value=(schedule, []),
        ):
            recovered_response = self.client.post(
                "/ilp_solver", json={"trip_id": created["trip_id"]}
            )

        self.assertEqual(recovered_response.status_code, 200)
        with main.app.app_context():
            work = main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="itinerary",
            ).one()
            self.assertGreater(work.generation, old_generation)
            new_plan = main.Itinerary.query.filter_by(
                trip_id=created["trip_id"]
            ).one().daily_plan
            self.assertFalse(
                workflow_ledger.finish_solver(
                    created["trip_id"],
                    old_generation,
                    "old-polling-solver",
                    {"old": {"places": []}},
                )
            )
            self.assertEqual(
                main.Itinerary.query.filter_by(
                    trip_id=created["trip_id"]
                ).one().daily_plan,
                new_plan,
            )

    def test_failed_clustering_is_reported_and_retry_uses_a_new_task_id(self):
        created = self.make_trip()
        old_task_id = created["tasks"]["clustering"]["task_id"]
        self.set_work_result(
            created,
            "clustering",
            "FAILED",
            error="provider unavailable",
        )
        status_response = self.client.get(
            f"/trip/{created['trip_id']}/status"
        )
        hotel_response = self.client.post(
            "/hotel_option", json={"trip_id": created["trip_id"]}
        )
        solver_response = self.client.post(
            "/ilp_solver", json={"trip_id": created["trip_id"]}
        )

        self.assertEqual(
            status_response.get_json()["tasks"]["clustering"]["status"],
            "FAILURE",
        )
        self.assertEqual(hotel_response.status_code, 500)
        self.assertEqual(solver_response.status_code, 500)

        with patch.object(main.perform_clustering, "apply_async") as enqueue:
            retry_response = self.client.post(
                f"/trip/{created['trip_id']}/tasks/clustering/retry"
            )
        self.assertEqual(retry_response.status_code, 202)
        new_task_id = retry_response.get_json()["task"]["task_id"]
        self.assertNotEqual(new_task_id, old_task_id)
        enqueue.assert_not_called()

        duplicate_retry = self.client.post(
            f"/trip/{created['trip_id']}/tasks/clustering/retry"
        )
        self.assertEqual(duplicate_retry.status_code, 202)
        self.assertEqual(
            duplicate_retry.get_json()["task"]["task_id"],
            new_task_id,
        )
        enqueue.assert_not_called()

    def test_revoked_clustering_task_is_reported_as_a_failure(self):
        created = self.make_trip()
        with main.app.app_context():
            main.TripWork.query.filter_by(
                trip_id=created["trip_id"],
                workflow="clustering",
            ).delete(synchronize_session=False)
            main.db.session.commit()
        with patch.object(
            main,
            "AsyncResult",
            return_value=self.async_result("REVOKED"),
        ):
            response = self.client.get(
                f"/trip/{created['trip_id']}/status"
            )

        clustering = response.get_json()["tasks"]["clustering"]
        self.assertEqual(response.get_json()["status"], "failed")
        self.assertEqual(clustering["status"], "FAILURE")
        self.assertEqual(clustering["error"], "Task was revoked.")

    def test_invalid_mandatory_coordinates_fail_clustering_task(self):
        input_data = {
            "places": [
                {
                    "id": 1,
                    "name": "Mandatory place",
                    "is_mandatory": True,
                    "latitude": 0,
                    "longitude": 0,
                }
            ]
        }
        with patch.object(
            tasks.poi_get,
            "run_travel_planner_external",
            return_value=input_data,
        ):
            with self.assertRaisesRegex(RuntimeError, "invalid coordinates"):
                tasks.perform_clustering.run(
                    "Mumbai", 1, ["Mandatory place"], [], []
                )

    def test_generated_clustering_result_passes_shared_validator(self):
        input_data = {
            "places": [
                {
                    "id": 1,
                    "name": "Mumbai landmark",
                    "is_mandatory": False,
                    "latitude": 19.0,
                    "longitude": 72.0,
                    "smart_score": 10.0,
                    "time_duration_hours": 1.0,
                    "schedule": {},
                }
            ]
        }
        clusterer = Mock()
        clusterer.fit_predict.return_value = [0]
        clusterer.cluster_centers_ = tasks.np.array([[19.0, 72.0]])

        with (
            patch.object(
                tasks.poi_get,
                "run_travel_planner_external",
                return_value=input_data,
            ),
            patch.object(tasks, "KMeansConstrained", return_value=clusterer),
        ):
            result = tasks.perform_clustering.run(
                "Mumbai", 1, [], [], []
            )

        self.assertIs(validate_clustering_result(result), result)


    def _create_itinerary_for_insights_test(self):
        result = self.make_trip(destination="Mumbai")
        trip_id = result["trip_id"]

        daily_plan = {
            "2026-11-01": {
                "places": [
                    {
                        "id": 101,
                        "name": "Gateway of India",
                        "category": "History",
                        "description": "Historic waterfront monument",
                        "time_duration_hours": 1.0,
                    }
                ]
            }
        }

        with main.app.app_context():
            itinerary = main.Itinerary(
                trip_id=trip_id,
                daily_plan=daily_plan,
            )
            main.db.session.add(itinerary)
            main.db.session.commit()

        return trip_id

    def test_place_insights_returns_cached_result_without_calling_gemini(self):
        trip_id = self._create_itinerary_for_insights_test()
        expected_insights = {
            "overview": "A historic waterfront landmark.",
            "highlights": ["Architecture", "Harbour views", "Photography"],
            "tips": ["Allow time for photographs", "Check local conditions"],
            "suggested_duration": "Around 1 hour",
        }

        with main.app.app_context():
            main.db.session.add(
                main.PlaceInsight(
                    trip_id=trip_id,
                    place_key="101",
                    place_name="Gateway of India",
                    insights=expected_insights,
                )
            )
            main.db.session.commit()

        with patch.object(
            main,
            "ChatGoogleGenerativeAI",
            side_effect=AssertionError("Gemini should not be called"),
        ):
            response = self.client.post(
                f"/trip/{trip_id}/places/insights",
                json={
                    "place_id": 101,
                    "place_name": "Gateway of India",
                },
            )

        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertTrue(body["cached"])
        self.assertEqual(body["insights"], expected_insights)

    def test_place_insights_rejects_place_not_in_itinerary(self):
        trip_id = self._create_itinerary_for_insights_test()

        with patch.object(
            main,
            "ChatGoogleGenerativeAI",
            side_effect=AssertionError("Gemini should not be called"),
        ):
            response = self.client.post(
                f"/trip/{trip_id}/places/insights",
                json={
                    "place_id": 999,
                    "place_name": "Unrelated place",
                },
            )

        self.assertEqual(response.status_code, 404)
        self.assertIn("error", response.get_json())

    def test_place_insights_handles_gemini_failure_without_caching(self):
        trip_id = self._create_itinerary_for_insights_test()

        with (
            patch.dict(os.environ, {"GOOGLE_API_KEY": "test-key"}),
            patch.object(
                main,
                "ChatGoogleGenerativeAI",
                side_effect=RuntimeError("Simulated Gemini failure"),
            ),
        ):
            response = self.client.post(
                f"/trip/{trip_id}/places/insights",
                json={
                    "place_id": 101,
                    "place_name": "Gateway of India",
                },
            )

        self.assertEqual(response.status_code, 502)

        with main.app.app_context():
            cached = main.PlaceInsight.query.filter_by(
                trip_id=trip_id,
                place_key="101",
            ).first()
            self.assertIsNone(cached)

class PlaceValidationTests(unittest.TestCase):
    def test_coordinates_reject_missing_nonfinite_out_of_range_and_zero_pair(self):
        invalid_places = [
            {},
            {"gps_coordinates": {"latitude": float("nan"), "longitude": 12}},
            {"gps_coordinates": {"latitude": 91, "longitude": 12}},
            {"gps_coordinates": {"latitude": 12, "longitude": 181}},
            {"gps_coordinates": {"latitude": 0, "longitude": 0}},
        ]
        for place in invalid_places:
            with self.subTest(place=place):
                self.assertIsNone(poi_get.extract_valid_coordinates(place))

        self.assertEqual(
            poi_get.extract_valid_coordinates(
                {"gps_coordinates": {"latitude": "19.1", "longitude": "72.8"}}
            ),
            (19.1, 72.8),
        )

    def test_destination_match_accepts_chamundi_hill_for_mysore(self):
        place = {
            "title": "Shri Chamundeshwari Temple",
            "address": (
                "Shri Chamundeshwari Temple Road, Chamundi Hill, "
                "Chamundibetta, Karnataka 570010, India"
            ),
            "gps_coordinates": {
                "latitude": 12.272,
                "longitude": 76.67,
            },
        }

        self.assertTrue(
            poi_get.place_matches_destination(place, "Mysore")
        )

    def test_destination_match_rejects_wrong_qualifiers_for_mysore(self):
        place = {
            "address": (
                "Chamundi Hill, Chamundibetta, Maharashtra, India"
            ),
        }

        self.assertFalse(
            poi_get.place_matches_destination(
                place, "Mysore, Karnataka, India"
            )
        )

    @patch.object(poi_get, "SERPAPI_KEY", "test-key")
    @patch.object(poi_get.serpapi_session, "get")
    def test_category_search_biases_destination_and_rejects_wrong_city(
        self, get_request
    ):
        response = Mock()
        response.json.return_value = {
            "local_results": [
                {
                    "title": "Unrelated monument",
                    "address": "Delhi, India",
                    "gps_coordinates": {"latitude": 28.6, "longitude": 77.2},
                },
                {
                    "title": "Local monument",
                    "address": "Mumbai, Maharashtra, India",
                    "gps_coordinates": {"latitude": 19.0, "longitude": 72.8},
                },
                {
                    "title": "No address result",
                    "gps_coordinates": {"latitude": 19.0, "longitude": 72.8},
                },
            ]
        }
        get_request.return_value = response

        places = poi_get.get_places_by_category("history", "Mumbai")

        self.assertEqual([place["title"] for place in places], ["Local monument"])
        params = get_request.call_args.kwargs["params"]
        self.assertEqual(params["location"], "Mumbai")
        self.assertEqual(params["z"], 14)
        self.assertIn("Mumbai", params["q"])

    @patch.object(poi_get, "SERPAPI_KEY", "test-key")
    @patch.object(poi_get.serpapi_session, "get")
    def test_mandatory_search_does_not_accept_wrong_city_or_fabricate_place(
        self, get_request
    ):
        response = Mock()
        response.json.return_value = {
            "local_results": [
                {
                    "title": "Same-name place elsewhere",
                    "address": "Delhi, India",
                    "gps_coordinates": {"latitude": 28.6, "longitude": 77.2},
                }
            ]
        }
        get_request.return_value = response

        with self.assertRaisesRegex(ValueError, "not found in Mumbai"):
            poi_get.search_mandatory_place("Central Park", "Mumbai")

        self.assertEqual(get_request.call_count, 1)
        params = get_request.call_args.kwargs["params"]
        self.assertEqual(params["location"], "Mumbai")
        self.assertIn("Mumbai", params["q"])

    def test_destination_match_preserves_state_and_country_qualifiers(self):
        illinois_place = {
            "address": "Springfield, Illinois, United States",
            "gps_coordinates": {"latitude": 39.8, "longitude": -89.6},
        }
        massachusetts_place = {
            "address": "Springfield, Massachusetts, United States",
            "gps_coordinates": {"latitude": 42.1, "longitude": -72.6},
        }

        self.assertTrue(
            poi_get.place_matches_destination(
                illinois_place, "Springfield, Illinois, United States"
            )
        )
        self.assertFalse(
            poi_get.place_matches_destination(
                massachusetts_place, "Springfield, Illinois, United States"
            )
        )
    def test_destination_match_accepts_mysuru_alias(self):
        place = {
            "address": (
                    "Agrahara, Chamrajpura, Mysuru, Karnataka 570001, India"
            ),
            "gps_coordinates": {
                "latitude": 12.305163,
                "longitude": 76.655175,
            },
        }

        self.assertTrue(
            poi_get.place_matches_destination(place, "Mysore")
        )


    def test_destination_match_rejects_missing_address(self):
        place = {
            "title": "Chamundeshwari Temple",
            "gps_coordinates": {
                "latitude": 12.272,
                "longitude": 76.67,
            },
        }


        self.assertFalse(
            poi_get.place_matches_destination(place, "Mysore")
        )

    @patch.object(poi_get, "SERPAPI_KEY", "test-key")
    @patch.object(poi_get.serpapi_session, "get")
    def test_mandatory_search_rejects_wrong_name_in_correct_city(self, get_request):
        response = Mock()
        response.json.return_value = {
            "local_results": [
                {
                    "title": "Another monument",
                    "address": "Mumbai, Maharashtra, India",
                    "gps_coordinates": {"latitude": 19.0, "longitude": 72.8},
                }
            ]
        }
        get_request.return_value = response

        with self.assertRaisesRegex(ValueError, "not found in Mumbai"):
            poi_get.search_mandatory_place("Gateway of India", "Mumbai")

    @patch.object(poi_get, "SERPAPI_KEY", "test-key")
    @patch.object(poi_get.serpapi_session, "get")
    def test_category_search_rejects_malformed_response_object(self, get_request):
        response = Mock()
        response.json.return_value = []
        get_request.return_value = response

        with self.assertRaisesRegex(ValueError, "invalid response object"):
            poi_get.get_places_by_category("history", "Mumbai")


class ClusteringValidationTests(unittest.TestCase):
    def test_validator_accepts_valid_output_and_rejects_invalid_shapes(self):
        valid = valid_clustering_result("Mumbai landmark")
        self.assertIs(validate_clustering_result(valid), valid)

        invalid_results = []
        invalid = copy.deepcopy(valid)
        invalid["Places"][0]["latitude"] = 91
        invalid_results.append(invalid)
        invalid = copy.deepcopy(valid)
        invalid["clustering"]["0"]["place_ids"] = [99]
        invalid_results.append(invalid)
        invalid = copy.deepcopy(valid)
        invalid["centroid"]["values"] = {}
        invalid_results.append(invalid)
        invalid = copy.deepcopy(valid)
        invalid["Places"][0]["id"] = []
        invalid_results.append(invalid)

        for result in invalid_results:
            with self.subTest(result=result), self.assertRaises(ValueError):
                validate_clustering_result(result)

    def test_centroids_must_match_members_with_rounding_tolerance(self):
        valid = valid_clustering_result("Mumbai landmark")
        second_place = copy.deepcopy(valid["Places"][0])
        second_place.update(
            id=2,
            name="Nearby landmark",
            latitude=19.0002,
            longitude=72.0002,
        )
        valid["Places"].append(second_place)
        valid["clustering"]["0"]["place_ids"].append(2)
        valid["centroid"]["values"]["0"] = {
            "lat": 19.0001 + 0.00005,
            "long": 72.0001 - 0.00005,
        }
        valid["centroid"]["avg_lat"] = 19.0001 + 0.00005
        valid["centroid"]["avg_long"] = 72.0001 - 0.00005

        self.assertIs(validate_clustering_result(valid), valid)

        wrong_cluster_center = copy.deepcopy(valid)
        wrong_cluster_center["centroid"]["values"]["0"] = {
            "lat": 19.5,
            "long": 72.5,
        }
        with self.assertRaisesRegex(ValueError, "centroid does not match"):
            validate_clustering_result(wrong_cluster_center)

        wrong_aggregate = copy.deepcopy(valid)
        wrong_aggregate["centroid"]["avg_lat"] = 20.0
        wrong_aggregate["centroid"]["avg_long"] = 73.0
        with self.assertRaisesRegex(ValueError, "Average centroid"):
            validate_clustering_result(wrong_aggregate)


class ErrorRedactionTests(unittest.TestCase):
    def test_provider_secret_is_redacted_from_task_exception_and_logs(self):
        fake_secret = "fake-serp-secret-123"
        provider_error = (
            "provider failed at "
            f"https://serpapi.test/search?api_key={fake_secret}&engine=maps "
            "Authorization: Bearer fake-bearer-token-456"
        )
        with patch.dict(
            os.environ,
            {
                "SERPAPI_KEY": fake_secret,
                "TEST_AUTH_TOKEN": "fake-bearer-token-456",
            },
        ):
            with (
                patch.object(
                    tasks.poi_get,
                    "run_travel_planner_external",
                    side_effect=RuntimeError(provider_error),
                ),
                self.assertLogs("tasks", level="ERROR") as captured_logs,
                self.assertRaises(RuntimeError) as captured_error,
            ):
                tasks.perform_clustering.run("Mumbai", 1, [], [], [])

        self.assertNotIn(fake_secret, str(captured_error.exception))
        self.assertNotIn("fake-bearer-token-456", str(captured_error.exception))
        self.assertNotIn(fake_secret, "\n".join(captured_logs.output))
        self.assertNotIn("fake-bearer-token-456", "\n".join(captured_logs.output))
        self.assertIn("[REDACTED]", "\n".join(captured_logs.output))



class TripPreferenceInterpreterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        main.app.config.update(TESTING=True, LOGIN_DISABLED=False)
        with main.app.app_context():
            main.db.create_all()

    @classmethod
    def tearDownClass(cls):
        with main.app.app_context():
            main.db.session.remove()
            main.db.drop_all()

    def setUp(self):
        with main.app.app_context():
            main.db.session.remove()
            main.db.drop_all()
            main.db.create_all()
            user = main.User(name="Test User", email="test@example.com")
            user.set_password("test-password")
            main.db.session.add(user)
            main.db.session.commit()

        self.client = main.app.test_client()
        response = self.client.post(
            "/login",
            json={"email": "test@example.com", "password": "test-password"},
        )
        self.assertEqual(response.status_code, 200)

    def test_rejects_missing_description(self):
        response = self.client.post("/interpret_trip_preferences", json={})
        self.assertEqual(response.status_code, 400)

    def test_rejects_blank_description(self):
        response = self.client.post(
            "/interpret_trip_preferences", json={"description": "   "}
        )
        self.assertEqual(response.status_code, 400)

    def test_rejects_oversized_description(self):
        response = self.client.post(
            "/interpret_trip_preferences",
            json={"description": "x" * 4001},
        )
        self.assertEqual(response.status_code, 400)

    def test_requires_authentication(self):
        response = main.app.test_client().post(
            "/interpret_trip_preferences",
            json={"description": "A relaxed trip to Mysuru"},
        )
        self.assertEqual(response.status_code, 401)

    def test_returns_normalized_valid_preferences(self):
        import json

        model_result = {
            "origin_city": "Bengaluru",
            "destination_city": "Mysuru",
            "duration_days": 3,
            "start_date": None,
            "end_date": None,
            "num_people": 2,
            "budget_type": "Economy",
            "budget_amount": None,
            "preferences": ["history", "museum"],
            "dislikes": ["sports"],
            "mandatory_places": ["Mysore Palace"],
            "food_preference": "Veg-Only",
            "pace": "Relaxed",
        }
        fake_response = Mock(content=json.dumps(model_result))
        fake_llm = Mock()
        fake_llm.invoke.return_value = fake_response

        with (
            patch.dict(os.environ, {"GOOGLE_API_KEY": "test-api-key"}),
            patch(
                "langchain_core.prompts.ChatPromptTemplate.from_messages"
            ) as prompt_factory,
            patch.object(main, "ChatGoogleGenerativeAI", return_value=Mock()) as llm_factory,
        ):
            prompt = prompt_factory.return_value
            prompt.__or__ = Mock(return_value=fake_llm)

            response = self.client.post(
                "/interpret_trip_preferences",
                json={
                    "description": (
                        "Three relaxed days in Mysuru with history, museums, "
                        "vegetarian food, and Mysore Palace."
                    )
                },
            )

        self.assertEqual(response.status_code, 200, response.get_json())
        interpreted = response.get_json()["preferences"]
        self.assertEqual(interpreted["destination_city"], "Mysuru")
        self.assertEqual(interpreted["preferences"], ["history", "museums"])
        self.assertEqual(interpreted["food_preference"], "Veg-Only")
        self.assertEqual(interpreted["pace"], "Relaxed")
        self.assertEqual(interpreted["mandatory_places"], ["Mysore Palace"])
        llm_factory.assert_called_once()

    def test_returns_service_unavailable_without_api_key(self):
        with patch.dict(os.environ, {"GOOGLE_API_KEY": ""}):
            response = self.client.post(
                "/interpret_trip_preferences",
                json={"description": "A relaxed trip to Mysuru"},
            )
        self.assertEqual(response.status_code, 503)



if __name__ == "__main__":
    unittest.main()
