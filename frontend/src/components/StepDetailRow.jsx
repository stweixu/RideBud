import React from "react";
import { MapPin } from "lucide-react";

import {
  Car,
  Train,
  Bus,
  FootprintsIcon,
  Ruler,
  Bike,
  Navigation,
} from "lucide-react";

// Icon resolver
const getLucideIcon = (iconHint) => {
  switch (iconHint) {
    case "Car":
      return Car;
    case "Bus":
      return Bus;
    case "Train":
    case "MRT":
      return Train;
    case "FootprintsIcon":
    case "Walk":
      return FootprintsIcon;
    case "Bike":
    case "Bicycle":
      return Bike;
    case "Navigation":
      return Navigation;
    default:
      return MapPin;
  }
};

// Color map
const colorMap = {
  walking: "bg-gray-400",
  bus: "bg-purple-500",
  train: "bg-pink-400",
  mrt: "bg-red-400",
  carpool: "bg-green-600",
};

const StepDetailRow = ({
  step,
  steps,
  index,
  isLastStepInList,
  cumulativeTimeInMinutes,
  startTime,
  onHoverStep,
  onLeaveStep,
  onClickStep,
  isHighlighted,
  formatTimeWithOffset,
}) => {
  const StepIcon = getLucideIcon(step.icon);

  const distanceText =
    typeof step.distance === "object" && step.distance !== null
      ? step.distance.text
      : step.distance;

  const handleMouseEnter = () => {
    if (step.start_location) {
      onHoverStep(step);
    }
  };

  const handleMouseLeave = () => {
    onLeaveStep();
  };

  const handleClick = () => {
    if (step.start_location) {
      onClickStep(step);
    }
  };

  // 👇 NEW: get next step for coloring the end address
  const nextStep = steps?.[index + 1];
  const nextStepType = nextStep?.type?.toLowerCase?.();
  const nextStepIcon = nextStep?.icon;
  const endPinColor = colorMap[nextStepType] || "bg-orange-600";
  const EndPinIcon = getLucideIcon(nextStepIcon);

  return (
    <>
      {/* Step row */}
      <div className={`flex items-start gap-3 relative pb-4`}>
        <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gray-300 border-l border-dashed border-gray-400"></div>

        <div
          className={`flex-shrink-0 size-10 flex items-center justify-center z-10 text-gray-500 ${
            isHighlighted ? "text-blue-600" : ""
          }`}
        >
          {StepIcon && <StepIcon className="h-5 w-5" />}
        </div>
        <div className="flex-grow space-y-0.5">
          <p className="text-sm text-gray-500 font-semibold">
            {step.duration || "N/A"}
          </p>
          <p
            className="font-small text-gray-800 text-sm"
            dangerouslySetInnerHTML={{ __html: step.description }}
          />
          <p className="text-xs text-gray-500">
            Distance: {distanceText || "N/A"}
          </p>
        </div>
      </div>

      {/* End waypoint */}
      {step.end_address && !isLastStepInList && (
        <div
          className={`flex items-start gap-3 relative pb-4 -mt-2 cursor-pointer transition-all duration-200 ${
            isHighlighted
              ? "bg-blue-50 border-l-4 border-blue-500 rounded-lg p-2 -ml-2"
              : ""
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gray-300 border-l border-dashed border-gray-400"></div>
          <div
            className={`flex-shrink-0 size-9 flex items-center justify-center ${endPinColor} rounded-full text-white z-10 shadow-md`}
          >
            <EndPinIcon className="h-5 w-5" />
          </div>
          <div className="flex-grow space-y-0.5">
            <p className="font-medium text-gray-800">{step.end_address}</p>
            <p className="text-xs text-gray-500">
              Time: {formatTimeWithOffset(startTime, cumulativeTimeInMinutes)}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default StepDetailRow;
