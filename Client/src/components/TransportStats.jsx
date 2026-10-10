import React from "react";

export default function TransportStats({ options }) {
  const byType = (type) => options.filter((o) => o.type === type);

  const minPrice = (list) =>
    list.length ? Math.min(...list.map((o) => o.price)) : null;

  const avgDuration = (list) => {
    const vals = list
      .map((o) => {
        const d = o.duration;
        if (typeof d === "number") return d;
        if (!isNaN(d)) return parseFloat(d);
        if (typeof d === "string" && d.includes("h")) {
          const m = d.match(/(\d+)h\s*(\d+)?m?/);
          return m ? parseInt(m[1]) + parseInt(m[2] || 0) / 60 : null;
        }
        return null;
      })
      .filter(Boolean);

    if (!vals.length) return "N/A";
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return `${Math.floor(avg)}h ${Math.round((avg % 1) * 60)}m`;
  };

  const cards = [
    { type: "bus", label: "Bus Options", color: "blue", icon: "↔" },
    { type: "train", label: "Train Options", color: "green", icon: "⚡" },
    { type: "flight", label: "Flight Options", color: "purple", icon: "✈" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((c) => {
        const list = byType(c.type);

        return (
          <div
            key={c.type}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-lg flex items-center justify-center
                  bg-${c.color}-100 text-${c.color}-600 text-lg font-bold`}
                >
                  {c.icon}
                </div>
                <h3 className="font-semibold text-gray-800">
                  {c.label}
                </h3>
              </div>

              <div
                className={`text-3xl font-bold text-${c.color}-600`}
              >
                {list.length}
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Starting from</span>
                <span className={`font-bold text-${c.color}-600`}>
                  {minPrice(list) ? `₹${minPrice(list)}` : "N/A"}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Avg. Duration</span>
                <span className="font-medium text-gray-700">
                  {avgDuration(list)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
