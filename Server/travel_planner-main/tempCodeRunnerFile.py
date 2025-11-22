@app.route("/list_trips", methods=["GET"])
@login_required
def list_trips():
    today = date.today()
    
    # 1. Find all trips for the currently logged-in user
    trips = Trip.query.filter_by(user_id=current_user.id).all()
    
    trips_data = []
    
    # 2. Loop through them and format the data
    for trip in trips:
        # Calculate days left until the trip starts
        # If negative, the trip has already started
        days_left = (trip.start_date - today).days
        
        trips_data.append({
            "id": trip.id,
            # "user_id": trip.user_id,
            
            # Location & Time
            "origin_city": trip.origin_city,
            "destination_city": trip.destination_city,
            "start_date": trip.start_date.isoformat(), # Format as "YYYY-MM-DD" string
            "end_date": trip.end_date.isoformat(),
            # Calculated field
            "days_left": days_left
        })
        
    # 3. Return the list of trip objects
    return jsonify(trips_data), 200