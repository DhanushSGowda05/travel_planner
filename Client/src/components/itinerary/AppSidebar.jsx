import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plane,
  Compass,
  Calendar,
  Wallet,
  PanelLeftClose,
} from "lucide-react";

export default function AppSidebar({
  days,
  selectedDayId,
  onSelectDay,
  isOpen,
  onToggle,
}) {
  const [expandedSections, setExpandedSections] = useState([
    "overview",
    "itinerary",
  ]);

  const sections = [
    {
      id: "overview",
      label: "Overview",
      icon: Compass,
      items: [
        { id: "explore", label: "Explore" },
        { id: "notes", label: "Notes" },
        { id: "places", label: "Places to visit" },
      ],
    },

    {
      id: "itinerary",
      label: "Itinerary",
      icon: Calendar,

      items: days.map((day) => {
        const d = new Date(day.date);
        const label = d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        // FIXED PREVIEW TO AVOID split() ERRORS
        const preview =
          day.places.length > 0
            ? day.places
                .slice(0, 2)
                .map((p) => (p?.name || "Place").split(" ")[0])
                .join(" • ") + (day.places.length > 2 ? " ..." : "")
            : "";

        return { id: day.id, label, sublabel: preview };
      }),
    },

    {
      id: "budget",
      label: "Budget",
      icon: Wallet,
      items: [{ id: "view-budget", label: "View" }],
    },
  ];

  const toggleSection = (id) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ---------------------------------------------
      COLLAPSED SIDEBAR
  --------------------------------------------- */
  if (!isOpen) {
    return (
      <div className="w-14 h-full bg-white border-r flex flex-col items-center py-4 gap-6">
        {/* Logo / Expand button */}
        <button
          onClick={onToggle}
          className="flex flex-col items-center gap-1 hover:bg-gray-100 p-2 rounded-lg"
        >
          <Plane className="w-6 h-6 text-blue-600" />
        </button>

        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------
      EXPANDED SIDEBAR
  --------------------------------------------- */
  return (
    <div className="w-60 h-full bg-white border-r flex flex-col">
      {/* Header / Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b">
        <button onClick={onToggle}>
          <Plane className="w-7 h-7 text-blue-600" />
        </button>
        <span className="text-xl font-semibold tracking-tight">TripCraft</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {sections.map((section) => (
          <div key={section.id}>
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 transition"
            >
              {expandedSections.includes(section.id) ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}

              <section.icon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">{section.label}</span>
            </button>

            {/* Section Items */}
            {expandedSections.includes(section.id) && (
              <div className="ml-6 mt-1 space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (section.id === "itinerary") onSelectDay(item.id);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition 
                      ${
                        selectedDayId === item.id
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    <div className="truncate">{item.label}</div>

                    {item.sublabel && (
                      <div className="text-xs text-gray-500 truncate">
                        {item.sublabel}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Collapse Button */}
      <div className="p-3 border-t">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
        >
          <PanelLeftClose className="w-4 h-4" />
          Hide sidebar
        </button>
      </div>
    </div>
  );
}
