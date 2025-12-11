// mockItinerary.js

export const mockTrip = {
  id: "trip-1",
  name: "Coastal Karnataka Trip",
  startDate: "2025-10-01",
  endDate: "2025-10-04",
  days: [
    {
      id: "day-1",
      date: "2025-10-01",
      dayNumber: 1,
      places: [
        {
          id: "place-1",
          name: "Malpe Beach",
          description:
            "A pristine beach known for its clean shores, water sports activities, and stunning sunsets. Perfect for a relaxing morning walk.",
          category: "Beach",
          imageUrl:
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
          lat: 13.3522,
          lng: 74.7033,
          rating: 4.6,
          reviewCount: 9689,
          travelTimeToNext: 55,
          distanceToNext: 4,
          addedBy: "Added by you",
        },
        {
          id: "place-2",
          name: "St Mary's Island",
          description:
            "Serene group of 4 islands known for unique lava formations, hiking & birdwatching opportunities.",
          category: "Island",
          imageUrl:
            "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop",
          lat: 13.3768,
          lng: 74.6789,
          rating: 4.5,
          reviewCount: 7234,
          travelTimeToNext: 45,
          distanceToNext: 8,
        },
        {
          id: "place-3",
          name: "Kaup Lighthouse",
          description:
            "Historic lighthouse offering panoramic views of the Arabian Sea and surrounding coastline.",
          category: "Landmark",
          imageUrl:
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
          lat: 13.2278,
          lng: 74.7453,
          rating: 4.4,
          reviewCount: 3421,
        },
      ],
    },

    {
      id: "day-2",
      date: "2025-10-02",
      dayNumber: 2,
      places: [
        {
          id: "place-4",
          name: "Sri Krishna Temple",
          description:
            "Famous Hindu temple dedicated to Lord Krishna, known for its unique traditions and architecture.",
          category: "Temple",
          imageUrl:
            "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=300&fit=crop",
          lat: 13.3409,
          lng: 74.7514,
          rating: 4.7,
          reviewCount: 15234,
          travelTimeToNext: 30,
          distanceToNext: 6,
        },
        {
          id: "place-5",
          name: "Manipal Lake",
          description:
            "Scenic artificial lake surrounded by lush greenery, ideal for evening walks and boating.",
          category: "Nature",
          imageUrl:
            "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=300&fit=crop",
          lat: 13.3524,
          lng: 74.7868,
          rating: 4.3,
          reviewCount: 2156,
        },
      ],
    },

    {
      id: "day-3",
      date: "2025-10-03",
      dayNumber: 3,
      places: [
        {
          id: "place-6",
          name: "Delta Beach",
          description:
            "Quiet beach perfect for those seeking solitude and natural beauty away from crowds.",
          category: "Beach",
          imageUrl:
            "https://images.unsplash.com/photo-1520942702018-0862200e6873?w=400&h=300&fit=crop",
          lat: 13.3812,
          lng: 74.6923,
          rating: 4.2,
          reviewCount: 1823,
          travelTimeToNext: 25,
          distanceToNext: 5,
        },
        {
          id: "place-7",
          name: "Malpe Fish Market",
          description:
            "Vibrant local fish market offering fresh catch and authentic coastal Karnataka experience.",
          category: "Market",
          imageUrl:
            "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400&h=300&fit=crop",
          lat: 13.3567,
          lng: 74.7089,
          rating: 4.1,
          reviewCount: 987,
        },
      ],
    },

    {
      id: "day-4",
      date: "2025-10-04",
      dayNumber: 4,
      places: [],
    },
  ],
};

export const recommendedPlaces = [
  {
    id: "rec-1",
    name: "Malpe",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=150&fit=crop",
    category: "Beach",
  },
  {
    id: "rec-2",
    name: "Corporation Bank Heritage Museum",
    imageUrl:
      "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=200&h=150&fit=crop",
    category: "Museum",
  },
  {
    id: "rec-3",
    name: "Shri Krishna Matha",
    imageUrl:
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=200&h=150&fit=crop",
    category: "Temple",
  },
  {
    id: "rec-4",
    name: "Kolluru Shri Mookambika",
    imageUrl:
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=200&h=150&fit=crop",
    category: "Temple",
  },
  {
    id: "rec-5",
    name: "Kapu Beach",
    imageUrl:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=200&h=150&fit=crop",
    category: "Beach",
  },
];
