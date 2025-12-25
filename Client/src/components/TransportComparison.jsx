import React, { useState } from "react";
import TransportCard from "./TransportCard";
import TransportStats from "./TransportStats";

export default function TransportComparison({
  options,
  selected,
  onSelect,
}) {
  const [activeTab, setActiveTab] = useState("bus");

  const colorMap = {
    bus: "blue",
    train: "green",
    flight: "purple",
  };

  const filtered = options.filter((o) => o.type === activeTab);

  return (
    <div className="space-y-8">
      <TransportStats options={options} />

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-2 rounded-xl shadow">
        {["bus", "train", "flight"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-4 rounded-lg transition-all font-semibold
              ${
                activeTab === t
                  ? t === "bus"
                    ? "bg-blue-500 text-white"
                    : t === "train"
                    ? "bg-green-500 text-white"
                    : "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
          >
            {t} ({options.filter((o) => o.type === t).length})
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <TransportCard
            key={item.id}
            transport={item}
            isSelected={selected?.id === item.id}
            onSelect={() => onSelect(item)}
            tabColor={colorMap[activeTab]}
          />
        ))}
      </div>
    </div>
  );
}
