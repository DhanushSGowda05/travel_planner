import React from "react";

export default function AccommodationCard({ option, selected, onSelect }) {
  // option: accId, provider, pricePerNight, totalPrice, rating, thumbnail
  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-shadow ${
        selected ? "shadow-lg border-cyan-500" : "hover:shadow-md"
      }`}
      onClick={() => onSelect(option)}
    >
      <div className="flex gap-4">
        {option.thumbnail ? (
          <img src={option.thumbnail} alt={option.provider} className="w-24 h-16 object-cover rounded" />
        ) : (
          <div className="w-24 h-16 bg-slate-100 rounded flex items-center justify-center text-slate-400">
            Hotel
          </div>
        )}

        <div className="flex-1">
          <div className="font-semibold text-slate-900">{option.provider}</div>
          <div className="text-sm text-slate-600">Rating: {option.rating} ★</div>
          <div className="text-sm text-slate-500 mt-2">₹{option.totalPrice} total</div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold">₹{option.pricePerNight}/nt</div>
        </div>
      </div>
    </div>
  );
}
