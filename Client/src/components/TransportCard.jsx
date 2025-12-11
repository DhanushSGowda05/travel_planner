import React from "react";
import { Plane, Train, Bus } from "lucide-react";

export default function TransportCard({ option, selected, onSelect }) {
  const mode = option.type; // "flight" | "train" | "bus"

  const Icon =
    mode === "flight" ? Plane :
    mode === "train" ? Train :
    Bus;

  return (
    <div
      onClick={() => onSelect(option)}
      className={`
        cursor-pointer rounded-xl p-5 
        backdrop-blur-xl bg-white/20 border 
        transition-all duration-300
        ${selected ? "border-cyan-400 shadow-2xl scale-[1.02]" : "border-white/30 hover:border-cyan-200 hover:shadow-lg"}
      `}
    >

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-white drop-shadow" />
          <span className="text-white font-semibold capitalize">
            {mode}
          </span>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-white drop-shadow">₹{option.price_INR}</div>
          <div className="text-white/80 text-sm">
            {option.durationMin ? `${option.durationMin} min` : ""}
          </div>
        </div>
      </div>

      {/* Route */}
      <div className="bg-white/20 rounded-lg px-4 py-3 shadow-inner text-white">
        <div className="flex justify-between">
          <div className="font-semibold">{option.source_city}</div>
          <div className="text-sm text-white/80">→</div>
          <div className="font-semibold">{option.destination_city}</div>
        </div>
        <div className="text-white/70 text-xs mt-1">
          {option.departure_date}
        </div>
      </div>

      {/* Extra metadata */}
      {option.meta && (
        <div className="mt-3 text-white/90 text-xs">
          {Object.entries(option.meta).map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="capitalize">{k}</span>
              <span className="font-semibold">{String(v)}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
