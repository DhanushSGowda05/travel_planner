import { GripVertical, Trash2 } from "lucide-react";

export default function PlaceCard({
  place,
  index,
  isSelected,
  isEditMode,
  onSelect,
  onDelete,
}) {
  return (
    <div
      className="transition-all duration-300"
      style={{ animation: `fadeIn 0.3s ease ${index * 50}ms` }}
    >
      <div
        onClick={onSelect}
        className={`p-4 rounded-xl border bg-white shadow-sm hover:shadow-md cursor-pointer group
          ${isSelected ? "ring-2 ring-blue-500 border-blue-500" : "border-gray-200"}
        `}
      >
        <div className="flex gap-4">
          
          {/* Drag handle + Number bubble */}
          <div className="flex items-start gap-2">
            {isEditMode && (
              <div className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>
            )}

            <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold">
              {index + 1}
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              {place.name}
            </h3>

            {/* Description (expand when selected) */}
            <p
              className={`text-sm text-gray-600 transition-all duration-300
                ${isSelected ? "" : "line-clamp-2"}
              `}
            >
              {place.description || "Add notes, links, etc. here"}
            </p>
          </div>

          {/* IMAGE */}
          {place.imageUrl && (
            <div className="w-32 h-24 rounded-lg overflow-hidden shrink-0">
              <img
                src={place.imageUrl}
                alt={place.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* DELETE — Only in edit mode */}
          {isEditMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
