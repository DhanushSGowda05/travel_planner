import os
import time
import json
import math
import logging
import traceback
import numpy as np
import pandas as pd
from celery import Celery
from k_means_constrained import KMeansConstrained
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
import poi_get  # Ensure this file is in the same directory
from dotenv import load_dotenv
from clustering_validation import validate_clustering_result
from safe_errors import sanitize_error_message

load_dotenv() 

# --- 1. Configure Celery ---
# Ensure Redis is running on localhost:6379
celery = Celery(
    'tasks',
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv(
        "CELERY_RESULT_BACKEND",
        os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    ),
)
# Trip workflows need task results after they finish so hotel selection and the
# solver can retrieve them; Redis eviction/persistence remains deployment-owned.
celery.conf.update(
    task_track_started=True,
    result_expires=None,
)
logger = logging.getLogger(__name__)

# --- 2. Define Data Models (for Gemini) ---
class PriceEstimate(BaseModel):
    cost_inr: float = Field(description="The estimated total daily cost in Indian Rupees (INR) as a numeric value.")

# --- 3. Helper Functions ---
def get_nearest_clusters(current_cluster_id, all_centers, top_n=2):
    """
    Calculates distances from the current cluster to all others 
    and returns the IDs of the nearest 'top_n' clusters.
    """
    distances = []
    current_center = all_centers[current_cluster_id]
    
    for other_id, other_center in enumerate(all_centers):
        if current_cluster_id == other_id:
            continue
        
        # Calculate Euclidean distance
        dist = np.linalg.norm(current_center - other_center)
        distances.append((other_id, dist))
    
    # Sort by distance (ascending)
    distances.sort(key=lambda x: x[1])
    
    # Return just the IDs of the top N closest clusters
    return [d[0] for d in distances[:top_n]]

# --- 4. Define Tasks ---

def _get_travel_cost_result(city_name: str, budget_type: str = "basic"):
    """
    Celery task to calculate travel cost using Google Gemini.
    Falls back to ₹20,000 if Gemini fails.
    """
    print(f"--- [Task Started] Fetching estimate for: {city_name} ({budget_type}) ---")

    BASE_FALLBACK_PRICE = 20000

    api_key = os.getenv("GOOGLE_API_KEY")

    multipliers = {
        "basic": 1.0,
        "economy": 1.25,
        "standard": 1.5,
        "premium": 2.0,
        "luxury": 2.25
    }

    budget_key = budget_type.lower().strip()
    multiplier = multipliers.get(budget_key, 1.0)

    # ✅ Fallback response
    def fallback():
        return {
            "city": city_name,
            "budget_type": budget_type,
            "base_avg": BASE_FALLBACK_PRICE,
            "final_cost": round(BASE_FALLBACK_PRICE * multiplier, 2),
            "currency": "INR",
            "source": "fallback"
        }

    if not api_key:
        return fallback()

    parser = PydanticOutputParser(pydantic_object=PriceEstimate)

    template = """
    You are a travel expert. Calculate the daily BASE cost (Basic Budget) for a traveler in {city}.
    Include: 3 Meals, Local Transport, and Entry Fee for some tourist places.
    Calculate the total cost in INDIAN RUPEES (INR).

    IMPORTANT: You must return strictly valid JSON.
    {format_instructions}
    """

    prompt = PromptTemplate(
        template=template,
        input_variables=["city"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )

    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.7,
            google_api_key=api_key
        )

        chain = prompt | llm | parser

        # ✅ SINGLE Gemini call (no retries)
        result = chain.invoke({"city": city_name})

        base_cost = result.cost_inr
        final_adjusted_cost = base_cost * multiplier

        return {
            "city": city_name,
            "budget_type": budget_type,
            "base_avg": round(base_cost, 2),
            "final_cost": round(final_adjusted_cost, 2),
            "currency": "INR",
            "source": "gemini"
        }

    except Exception:
        return fallback()


def _run_persisted_task(workflow, trip_id, generation, work_task_id, operation):
    from workflow_ledger import (
        claim_task,
        complete_work,
        fail_work,
        start_heartbeat,
    )
    import main

    if trip_id is None or generation is None or work_task_id is None:
        return operation()

    with main.app.app_context():
        if not claim_task(
            trip_id,
            workflow,
            work_task_id,
            generation,
        ):
            return None

    heartbeat = start_heartbeat(
        trip_id,
        workflow,
        generation,
        work_task_id,
    )
    try:
        result = operation()
        heartbeat.assert_owned()
        with main.app.app_context():
            if not complete_work(
                trip_id,
                workflow,
                generation,
                work_task_id,
                result,
            ):
                return None
        return result
    except Exception as error:
        with main.app.app_context():
            fail_work(
                trip_id,
                workflow,
                generation,
                work_task_id,
                error,
            )
        raise
    finally:
        heartbeat.stop()


@celery.task
def get_travel_cost(
    city_name: str,
    budget_type: str = "basic",
    trip_id=None,
    generation=None,
    work_task_id=None,
):
    return _run_persisted_task(
        "budget",
        trip_id,
        generation,
        work_task_id,
        lambda: _get_travel_cost_result(city_name, budget_type),
    )



def _perform_clustering_result(destination: str, days: int, mandatory_places: list, preferences: list, dislikes: list):
    """
    Celery task that fetches POI data using `poi_get` and performs K-Means Constrained clustering.
    
    Args:
        destination (str): City name (e.g., "Udaipur")
        days (int): Number of days for the trip (Number of Clusters)
        mandatory_places (list): List of mandatory place names
        preferences (list): List of user preferences (e.g., ["history"])
        dislikes (list): List of user dislikes
        
    Returns:
        dict: Final structured JSON containing Places, Centroid, and Clustering info.
    """
    print(f"--- [Task Started] Clustering for {destination} ({days} days) ---")

    try:
        if not isinstance(days, int) or days < 1:
            raise ValueError("Clustering days must be a positive integer.")

        # 1. Get data from external source
        # This calls your existing poi_get.py logic
        input_data = poi_get.run_travel_planner_external(
            destination,
            days,
            mandatory_places,
            preferences,
            dislikes
        )

        # 2. Data Preparation
        if not input_data or 'places' not in input_data:
            raise ValueError("No places data returned from poi_get.")

        df = pd.DataFrame(input_data['places'])
        
        if df.empty:
            raise ValueError("Places DataFrame is empty.")

        required_cols = {'id', 'is_mandatory', 'latitude', 'longitude'}
        missing_cols = required_cols - set(df.columns)
        if missing_cols:
            raise ValueError(
                f"Place data is missing required clustering columns: "
                f"{', '.join(sorted(missing_cols))}."
            )

        df['is_mandatory'] = df['is_mandatory'].fillna(False).astype(bool)
        coordinates = df[['latitude', 'longitude']].apply(
            pd.to_numeric, errors='coerce'
        )
        valid_coordinates = (
            np.isfinite(coordinates).all(axis=1)
            & coordinates['latitude'].between(-90, 90)
            & coordinates['longitude'].between(-180, 180)
            & ~(
                coordinates['latitude'].eq(0)
                & coordinates['longitude'].eq(0)
            )
        )
        invalid_mandatory = ~valid_coordinates & df['is_mandatory']
        if invalid_mandatory.any():
            if "name" in df:
                invalid_names = df.loc[invalid_mandatory, "name"].astype(str).tolist()
            else:
                invalid_names = [str(index) for index in df.index[invalid_mandatory]]
            raise ValueError(
                "Mandatory places have invalid coordinates: "
                + ", ".join(invalid_names)
            )
        rejected_count = int((~valid_coordinates).sum())
        if rejected_count:
            logger.warning(
                "Rejected %s place(s) with invalid coordinates before clustering.",
                rejected_count,
            )
            df = df.loc[valid_coordinates].copy()
            coordinates = coordinates.loc[valid_coordinates]
        if df.empty:
            raise ValueError("No places with valid coordinates are available.")

        df[['latitude', 'longitude']] = coordinates.astype(float)
        total_places = len(df)
        
        # Extract Features for Clustering
        X = df[['latitude', 'longitude']]
        
        # 3. Dynamic Constraint Calculation
        K = days
        avg_places_per_day = total_places // K
        
        # Handle edge case where there are fewer places than days
        if avg_places_per_day < 1:
            avg_places_per_day = 1
            K = total_places # Reduce clusters to match place count if necessary

        size_min = max(1, int(avg_places_per_day * 0.4)) 
        size_max = math.ceil(avg_places_per_day * 0.6)

        # Safety buffer for constraints to prevent infeasible solutions
        if K * size_min > total_places:
            size_min = total_places // K
        if K * size_max < total_places:
            size_max = math.ceil(total_places / K) + 1

        # 4. Clustering
        clf = KMeansConstrained(
            n_clusters=K,
            size_min=size_min,
            size_max=size_max,
            random_state=42
        )

        df['cluster_label'] = clf.fit_predict(X)
        cluster_centers = clf.cluster_centers_

        # 5. Constructing the Output
        
        # A. Places Data
        # Convert to dict and handle NaN values if any by replacing with None for JSON safety
        places_output = df.where(pd.notnull(df), None).to_dict(orient='records')

        # B. Centroid Data
        cluster_center_values = {}
        for idx, center in enumerate(cluster_centers):
            # center[0] is lat, center[1] is long based on X structure
            cluster_center_values[str(idx)] = {
                "lat": float(center[0]),
                "long": float(center[1])
            }
        avg_center_lat = df["latitude"].mean()
        avg_center_long = df["longitude"].mean()
        centroid_output = {
            "values": cluster_center_values,
            "avg_lat": float(avg_center_lat),
            "avg_long": float(avg_center_long)
        }

        # C. Clustering Data
        clustering_output = {}
        grouped = df.groupby('cluster_label')

        for cluster_id, group_df in grouped:
            # Basic Lists
            place_ids = group_df['id'].tolist()
            
            # Metrics
            # Check if smart_score exists, else fallback to 'score' or 0
            score_col = 'smart_score' if 'smart_score' in group_df.columns else 'score'
            if score_col in group_df.columns:
                avg_score = round(float(group_df[score_col].mean()), 2)
            else:
                avg_score = 0.0
            
            mandatory_count = int(group_df['is_mandatory'].sum())
            
            # Nearest Clusters
            # nearest = get_nearest_clusters(int(cluster_id), cluster_centers, top_n=2)
            
            clustering_output[str(cluster_id)] = {
                "place_ids": place_ids,
                "stats": {
                    "avg_score": avg_score,
                    "mandatory_count": mandatory_count
                }
            }

        final_structure = {
            "Places": places_output,
            "centroid": centroid_output,
            "clustering": clustering_output
        }
        
        print(f"--- [Task Finished] Clustering completed for {len(df)} places. ---")
        return validate_clustering_result(final_structure)

    except Exception as error:
        safe_error = sanitize_error_message(error)
        safe_traceback = sanitize_error_message(traceback.format_exc())
        logger.error(
            "Clustering task failed for %s: %s\n%s",
            destination,
            safe_error,
            safe_traceback,
        )
        raise RuntimeError(safe_error) from None


@celery.task
def perform_clustering(
    destination: str,
    days: int,
    mandatory_places: list,
    preferences: list,
    dislikes: list,
    trip_id=None,
    generation=None,
    work_task_id=None,
):
    return _run_persisted_task(
        "clustering",
        trip_id,
        generation,
        work_task_id,
        lambda: _perform_clustering_result(
            destination,
            days,
            mandatory_places,
            preferences,
            dislikes,
        ),
    )
