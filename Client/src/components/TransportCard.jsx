import React from "react";

export default function TransportCard({ option, selected, onSelect }) {
  // option expected fields: optionId, provider, price, durationMin, depart, arrive, meta
  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-shadow ${
        selected ? "shadow-lg border-cyan-500" : "hover:shadow-md"
      }`}
      onClick={() => onSelect(option)}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-slate-900">{option.provider}</div>
          <div className="text-sm text-slate-600">{option.depart} → {option.arrive}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">₹{option.price}</div>
          <div className="text-sm text-slate-500">{option.durationMin} min</div>
        </div>
      </div>

      {option.meta && (
        <div className="mt-3 text-xs text-slate-600">
          {Object.entries(option.meta).map(([k, v]) => (
            <span key={k} className="mr-3">
              <strong>{k}:</strong> {String(v)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
