import { MapPin, CircleDot } from "lucide-react";

export default function TransportCard({
  transport,
  isSelected,
  onSelect,
  tabColor,
}) {
  const formatTime = (time) => time?.slice(0, 5) || "";

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatDuration = (duration) => {
    if (!duration) return "";

    if (typeof duration === "number") {
      const h = Math.floor(duration);
      const m = Math.round((duration - h) * 60);
      return `${h}h ${m}m`;
    }

    if (!isNaN(duration)) {
      const hours = parseFloat(duration);
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return `${h}h ${m}m`;
    }

    if (typeof duration === "string" && duration.includes("h")) {
      return duration;
    }

    return "";
  };

  const accent =
    tabColor === "blue"
      ? "text-blue-600"
      : tabColor === "green"
        ? "text-green-600"
        : "text-purple-600";

  const border =
    tabColor === "blue"
      ? "border-blue-500"
      : tabColor === "green"
        ? "border-green-500"
        : "border-purple-500";

  const gradient =
    tabColor === "blue"
      ? "from-blue-500 to-blue-600"
      : tabColor === "green"
        ? "from-green-500 to-green-600"
        : "from-purple-500 to-purple-600";

  return (
    <div
      onClick={onSelect}
      className={`relative bg-white rounded-lg border-2 shadow-sm cursor-pointer
  transition-all duration-300 ease-out
  ${isSelected ? `${border} ring-2 ring-opacity-30` : "border-gray-200"}
  hover:-translate-y-1 hover:shadow-lg`}

    >
      {isSelected && (
        <div
          className={`absolute -top-3 -right-3 w-7 h-7 bg-gradient-to-r ${gradient}
          rounded-full flex items-center justify-center text-white text-sm`}
        >
          ✓
        </div>
      )}

      {/* Inner content */}
      <div className="px-6 py-5 space-y-3">
        {/* Title */}
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">
            {transport.name}
          </h3>
          <span className="text-xs capitalize bg-gray-100 px-2 py-1 rounded">
            {transport.type}
          </span>
        </div>

        {/* Stations */}
        {transport.source_station && (
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <CircleDot className="w-3.5 h-3.5 text-blue-500" />
              <span>{transport.source_station}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>{transport.destination_station}</span>
            </div>
          </div>
        )}

        {/* Journey Timeline */}
        <div className="flex items-center justify-between text-sm">
          {/* Departure */}
          <div className="text-left">
            <div className="text-xs text-gray-500 mb-1">Departure</div>
            <div className={`font-bold ${accent}`}>
              {formatTime(transport.departure)}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(transport.departure_date)}
            </div>
          </div>

          {/* Arrow + Duration */}
          <div className="flex flex-col items-center px-4 text-gray-400">
            <div className="flex items-center gap-2">
              <span className="border-t w-8 border-dashed" />
              <span className="text-lg">→</span>
              <span className="border-t w-8 border-dashed" />
            </div>
            <div className="text-xs mt-1">
              {formatDuration(transport.duration)}
            </div>
          </div>

          {/* Arrival */}
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Arrival</div>
            <div className={`font-bold ${accent}`}>
              {formatTime(transport.arrival)}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(transport.arrival_date)}
            </div>
          </div>
        </div>

        {/* Seats & Distance */}
        <div className="grid grid-cols-2 gap-4 my-3">
          <div className="bg-orange-50 p-3 rounded text-sm">
            <div className="text-gray-500 text-xs">Seats</div>
            <div className="font-bold text-orange-600">
              {transport.available_seats ?? "--"}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded text-sm">
            <div className="text-gray-500 text-xs">Distance</div>
            <div className="font-medium">
              {transport.distance
                ? `${Math.round(transport.distance)} km`
                : "--"}
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="flex justify-between items-center border-t border-gray-100 pt-4">
          <span className="text-gray-600 text-sm">Price</span>
          <span className={`text-xl font-bold ${accent}`}>
            ₹{transport.price}
          </span>
        </div>

        {/* Select Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`w-full py-2.5 rounded-md font-medium transition-all
            ${isSelected
              ? `bg-gradient-to-r ${gradient} text-white`
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
        >
          {isSelected ? "Selected" : "Select"}
        </button>
      </div>
    </div>
  );
}
