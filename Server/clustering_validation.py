import math
from collections.abc import Mapping
from numbers import Integral, Real


# Coordinates are degrees; 1e-4 degrees is roughly 11 m at the equator.
# The tolerance accommodates floating-point differences from KMeans centers.
CENTROID_TOLERANCE_DEGREES = 1e-4


def _valid_number(value, minimum, maximum):
    if isinstance(value, bool) or not isinstance(value, Real):
        return False
    try:
        number = float(value)
    except (OverflowError, TypeError, ValueError):
        return False
    return math.isfinite(number) and minimum <= number <= maximum


def _valid_identifier(value):
    return (
        isinstance(value, str) and bool(value.strip())
    ) or (
        isinstance(value, Integral) and not isinstance(value, bool)
    )


def validate_clustering_result(result):
    """Validate cluster structure and centers against their place coordinates."""
    if not isinstance(result, Mapping):
        raise ValueError("Clustering result must be an object.")

    places = result.get("Places")
    clusters = result.get("clustering")
    centroid = result.get("centroid")
    if not isinstance(places, list) or not places:
        raise ValueError("Clustering result must contain a non-empty Places list.")
    if not isinstance(clusters, Mapping) or not clusters:
        raise ValueError("Clustering result must contain a non-empty clustering map.")
    if not isinstance(centroid, Mapping):
        raise ValueError("Clustering result must contain a centroid object.")

    place_ids = set()
    for index, place in enumerate(places):
        if not isinstance(place, Mapping):
            raise ValueError(f"Place at index {index} must be an object.")
        if not isinstance(place.get("name"), str) or not place["name"].strip():
            raise ValueError(f"Place at index {index} has an invalid name.")
        place_id = place.get("id")
        if not _valid_identifier(place_id):
            raise ValueError(f"Place at index {index} has an invalid id.")
        if place_id in place_ids:
            raise ValueError(f"Duplicate place id: {place_id}.")
        place_ids.add(place_id)

        if (
            not _valid_number(place.get("latitude"), -90, 90)
            or not _valid_number(place.get("longitude"), -180, 180)
            or (
                float(place["latitude"]) == 0
                and float(place["longitude"]) == 0
            )
        ):
            raise ValueError(f"Place {place_id} has invalid coordinates.")
        if not isinstance(place.get("is_mandatory"), bool):
            raise ValueError(f"Place {place_id} has an invalid mandatory flag.")
        if not _valid_number(place.get("smart_score"), -float("inf"), float("inf")):
            raise ValueError(f"Place {place_id} has an invalid score.")
        if not _valid_number(
            place.get("time_duration_hours"), 0, float("inf")
        ) or float(place["time_duration_hours"]) <= 0:
            raise ValueError(f"Place {place_id} has an invalid visit duration.")
        schedule = place.get("schedule")
        if not isinstance(schedule, Mapping) or any(
            not isinstance(hours, str) for hours in schedule.values()
        ):
            raise ValueError(f"Place {place_id} has an invalid schedule.")

    cluster_ids = set()
    referenced_place_ids = []
    places_by_id = {place["id"]: place for place in places}
    centers = centroid.get("values")
    if not isinstance(centers, Mapping):
        raise ValueError("Centroid values must be an object.")
    for cluster_id, cluster in clusters.items():
        if not isinstance(cluster_id, str) or not cluster_id.strip():
            raise ValueError("Cluster identifiers must be non-empty strings.")
        if cluster_id in cluster_ids:
            raise ValueError(f"Duplicate cluster id: {cluster_id}.")
        cluster_ids.add(cluster_id)
        if not isinstance(cluster, Mapping):
            raise ValueError(f"Cluster {cluster_id} must be an object.")

        members = cluster.get("place_ids")
        stats = cluster.get("stats")
        if not isinstance(members, list) or not members:
            raise ValueError(f"Cluster {cluster_id} must contain place ids.")
        if not isinstance(stats, Mapping):
            raise ValueError(f"Cluster {cluster_id} must contain statistics.")
        if not _valid_number(stats.get("avg_score"), -float("inf"), float("inf")):
            raise ValueError(f"Cluster {cluster_id} has an invalid average score.")
        mandatory_count = stats.get("mandatory_count")
        if (
            not isinstance(mandatory_count, Integral)
            or isinstance(mandatory_count, bool)
            or not 0 <= mandatory_count <= len(members)
        ):
            raise ValueError(f"Cluster {cluster_id} has an invalid mandatory count.")

        for place_id in members:
            if not _valid_identifier(place_id):
                raise ValueError(f"Cluster {cluster_id} contains an invalid place id.")
            if place_id not in place_ids:
                raise ValueError(
                    f"Cluster {cluster_id} references unknown place id {place_id}."
                )
            referenced_place_ids.append(place_id)

        member_places = [places_by_id[place_id] for place_id in members]
        expected_latitude = sum(
            float(place["latitude"]) for place in member_places
        ) / len(member_places)
        expected_longitude = sum(
            float(place["longitude"]) for place in member_places
        ) / len(member_places)
        center = centers.get(cluster_id)
        if not isinstance(center, Mapping):
            raise ValueError(f"Cluster {cluster_id} has no centroid.")
        if (
            not _valid_number(center.get("lat"), -90, 90)
            or not _valid_number(center.get("long"), -180, 180)
        ):
            raise ValueError(f"Cluster {cluster_id} has invalid centroid coordinates.")
        if (
            abs(float(center["lat"]) - expected_latitude)
            > CENTROID_TOLERANCE_DEGREES
            or abs(float(center["long"]) - expected_longitude)
            > CENTROID_TOLERANCE_DEGREES
        ):
            raise ValueError(
                f"Cluster {cluster_id} centroid does not match its place coordinates."
            )

    if set(referenced_place_ids) != place_ids or len(referenced_place_ids) != len(place_ids):
        raise ValueError("Every place must belong to exactly one cluster.")

    average_latitude = centroid.get("avg_lat")
    average_longitude = centroid.get("avg_long")
    if (
        not _valid_number(average_latitude, -90, 90)
        or not _valid_number(average_longitude, -180, 180)
    ):
        raise ValueError("Clustering result has invalid average centroid coordinates.")

    expected_average_latitude = sum(
        float(place["latitude"]) for place in places
    ) / len(places)
    expected_average_longitude = sum(
        float(place["longitude"]) for place in places
    ) / len(places)
    if (
        abs(float(average_latitude) - expected_average_latitude)
        > CENTROID_TOLERANCE_DEGREES
        or abs(float(average_longitude) - expected_average_longitude)
        > CENTROID_TOLERANCE_DEGREES
    ):
        raise ValueError(
            "Average centroid does not match the place coordinates."
        )

    if not isinstance(centers, Mapping) or set(centers) != cluster_ids:
        raise ValueError("Centroid values must match the clustering map.")

    return result
