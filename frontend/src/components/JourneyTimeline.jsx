// components/JourneyTimeline.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Car,
  Train,
  Bus,
  FootprintsIcon,
  Bike,
  Navigation,
  MapPin,
} from "lucide-react";

// (Keep all helper functions: getLucideIcon, parseDurationStringToMinutes, parseTime, formatTime as they are)
// Helper function to get Lucide icon component
const getLucideIcon = (iconHint) => {
  switch (iconHint) {
    case "Car":
      return Car;
    case "Bus":
    case "PublicTransport":
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

// Helper function to parse duration strings into minutes
const parseDurationStringToMinutes = (durationString) => {
  if (!durationString) return 0;
  let totalMinutes = 0;
  const lowerCaseString = durationString.toLowerCase();
  const matches = lowerCaseString.match(/(\d+)\s*(hr|min|s|h|m)/g);
  if (matches) {
    for (const match of matches) {
      const value = parseInt(match.match(/\d+/)[0], 10);
      if (match.includes("hr") || match.includes("h")) {
        totalMinutes += value * 60;
      } else if (match.includes("min") || match.includes("m")) {
        totalMinutes += value;
      } else if (match.includes("s")) {
        totalMinutes += value / 60;
      }
    }
  } else {
    const numericMatch = lowerCaseString.match(/^(\d+)$/);
    if (numericMatch) {
      return parseInt(numericMatch[1], 10);
    }
  }
  return totalMinutes;
};

// Helper to parse "HH:mm am/pm" string to a Date object (on a fixed reference date)
const parseTime = (timeString) => {
  if (!timeString) return null;
  const referenceDate = new Date("2000-01-01T00:00:00");
  const match = timeString.match(/(\d+):(\d+)\s*(am|pm)/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toLowerCase();
  if (ampm === "pm" && hours < 12) {
    hours += 12;
  } else if (ampm === "am" && hours === 12) {
    hours = 0;
  }
  referenceDate.setHours(hours, minutes, 0, 0);
  return referenceDate;
};

// Helper to format Date object to "HH:mm am/pm" string
const formatTime = (date) => {
  if (!date) return "";
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  return `${hours}:${minutes} ${ampm}`;
};

const JourneyTimeline = ({ steps }) => {
  const containerRef = useRef(null);
  // `containerWidth` will be the actual width of the outermost `div` (the `overflow-x-auto` wrapper)
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure the width of the containing div to inform dynamic scaling
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    // Initial width on mount
    updateWidth();
    // Update width on resize
    window.addEventListener("resize", updateWidth);
    // Cleanup listener
    return () => window.removeEventListener("resize", updateWidth);
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount

  // --- Configuration Constants (all in Pixels for precise internal layout) ---
  const LABEL_WIDTH_PX = 100; // Fixed width for address labels (min-w-[100px] / max-w-[100px])
  const DOT_WIDTH_PX = 12; // Size of the circular marker dot (w-3 h-3 is approx 12px)
  const ICON_WIDTH_PX = 20; // Size of the step icon (w-5 h-5 is approx 20px)

  // Minimum required horizontal spacing between the *centers* of two consecutive dots.
  // This value is crucial for preventing overlap. It must be at least LABEL_WIDTH_PX + some buffer.
  const MIN_DOT_TO_DOT_SPACING_PX = LABEL_WIDTH_PX + 40; // 100px for label + 40px buffer

  // This is the default "stretch" factor for time-based spacing.
  // A higher value spreads things out more naturally based on duration.
  const PIXELS_PER_MINUTE_NATURAL_SCALE = 15; // e.g., 15 pixels per minute. Adjust this!

  // Target fill ratio for the timeline on large screens.
  // The timeline will try to fill this percentage of its *parent container's width*.
  // For maximum stretch, use 1.0 (100%). For a slight margin, use 0.9 or 0.8.
  const TARGET_FILL_RATIO_ON_WIDE_SCREENS = 0.9; // Adjust this!

  // Absolute minimum pixel width for the entire timeline to ensure it's not too small,
  // even for very short journeys or small numbers of steps. This overrides calculations
  // if they result in an extremely narrow timeline.
  const ABSOLUTE_MIN_TIMELINE_WIDTH_PX = 400; // e.g., 400px minimum width

  // Vertical offsets for elements relative to the horizontal line
  const TIME_LABEL_BOTTOM_OFFSET = 15;
  const ADDRESS_LABEL_TOP_OFFSET = 15;
  const ICON_TOP_OFFSET = 20;

  // --- Data Processing (Same as previous, just showing for context) ---
  const stepsWithNumericDuration = steps.map((step) => ({
    ...step,
    numericDuration: parseDurationStringToMinutes(step.duration || ""),
  }));

  const totalTime = stepsWithNumericDuration.reduce(
    (sum, step) => sum + (step.numericDuration || 0),
    0
  );

  const journeyMarkers = [];
  const renderedLocations = new Set();
  let currentCumulativeTime = 0;

  const addMarker = (
    address,
    coords,
    cumulativeTime,
    markerType = "location",
    associatedStepIndex = -1,
    timeLabel = ""
  ) => {
    const locationKey = `${address}-${coords?.lat}-${coords?.lng}-${cumulativeTime}`;
    if (!renderedLocations.has(locationKey)) {
      journeyMarkers.push({
        label: address,
        coords: coords,
        cumulativeTime: cumulativeTime,
        type: markerType,
        stepIndex: associatedStepIndex,
        time: timeLabel,
        idealPositionPx: 0, // Will be calculated dynamically
        adjustedPositionPx: 0, // Final position after overlap prevention
      });
      renderedLocations.add(locationKey);
    }
  };

  let initialJourneyStartTime = "";
  if (stepsWithNumericDuration.length > 0 && stepsWithNumericDuration[0].eta) {
    const firstStepEtaDate = parseTime(stepsWithNumericDuration[0].eta);
    const firstStepDurationMinutes =
      stepsWithNumericDuration[0].numericDuration;
    if (firstStepEtaDate) {
      const calculatedStartTime = new Date(
        firstStepEtaDate.getTime() - firstStepDurationMinutes * 60 * 1000
      );
      initialJourneyStartTime = formatTime(calculatedStartTime);
    }
  }

  if (stepsWithNumericDuration.length > 0) {
    addMarker(
      stepsWithNumericDuration[0].start_address,
      stepsWithNumericDuration[0].start_coords,
      0,
      "journey-start",
      -1,
      initialJourneyStartTime
    );
  }

  stepsWithNumericDuration.forEach((step, index) => {
    const stepDurationMinutes = step.numericDuration || 0;
    currentCumulativeTime += stepDurationMinutes;

    const isLastStep = index === stepsWithNumericDuration.length - 1;
    let endTimeForMarker = "";
    if (isLastStep) {
      endTimeForMarker = step.eta || "";
    }

    addMarker(
      step.end_address,
      step.end_coords,
      currentCumulativeTime,
      "step-end",
      index,
      endTimeForMarker
    );
  });

  journeyMarkers.sort((a, b) => a.cumulativeTime - b.cumulativeTime);

  // --- Dynamic Timeline Width Calculation and Marker Adjustment Logic ---
  let finalCalculatedTimelineWidthPx = 0; // This will be the `min-width` for the inner timeline

  if (journeyMarkers.length > 0) {
    // 1. Calculate the absolute minimum pixel width required to prevent any overlap.
    // This is the sum of MIN_DOT_TO_DOT_SPACING_PX for each segment + half label width at start/end.
    let minContentNoOverlapPx =
      (journeyMarkers.length - 1) * MIN_DOT_TO_DOT_SPACING_PX + LABEL_WIDTH_PX;
    if (journeyMarkers.length === 1) {
      // Special case for a single marker
      minContentNoOverlapPx = LABEL_WIDTH_PX;
    }

    // 2. Calculate a "natural" timeline length based on total duration and ideal scale.
    const naturalTimeBasedLengthPx =
      totalTime * PIXELS_PER_MINUTE_NATURAL_SCALE;

    // 3. Calculate a "stretch target" based on the parent's actual measured width.
    // This is what makes it "fill the container" on larger screens.
    // Use `containerWidth` (the measured width of the outer scrollable div).
    const stretchTargetWidthPx =
      containerWidth * TARGET_FILL_RATIO_ON_WIDE_SCREENS;

    // 4. Determine the `totalVirtualTimelineLengthPx` to use for distributing markers.
    // It must be at least:
    //    - The minimum to prevent overlap (`minContentNoOverlapPx`)
    //    - The natural length based on time (`naturalTimeBasedLengthPx`)
    //    - The target stretch width for wide screens (`stretchTargetWidthPx`)
    let totalVirtualTimelineLengthPx = Math.max(
      minContentNoOverlapPx,
      naturalTimeBasedLengthPx,
      stretchTargetWidthPx
    );

    // If totalTime is 0 (e.g., no steps with duration), we still need a base length for distribution.
    if (totalTime === 0 && journeyMarkers.length > 1) {
      totalVirtualTimelineLengthPx = Math.max(
        totalVirtualTimelineLengthPx,
        (journeyMarkers.length - 1) * MIN_DOT_TO_DOT_SPACING_PX
      );
    } else if (totalTime === 0 && journeyMarkers.length === 1) {
      totalVirtualTimelineLengthPx = Math.max(
        totalVirtualTimelineLengthPx,
        LABEL_WIDTH_PX
      );
    }

    // Now, calculate initial ideal pixel positions for markers based on this determined `totalVirtualTimelineLengthPx`.
    journeyMarkers.forEach((marker) => {
      marker.idealPositionPx =
        totalTime > 0 && totalVirtualTimelineLengthPx > 0
          ? (marker.cumulativeTime / totalTime) * totalVirtualTimelineLengthPx
          : 0;
    });

    // Adjust the first marker's position: it should be at LABEL_WIDTH_PX / 2 so its left-aligned label fits.
    journeyMarkers[0].adjustedPositionPx = 0;

    // Iterate and adjust positions to ensure no overlap and maintain minimum spacing.
    for (let i = 1; i < journeyMarkers.length; i++) {
      const prevMarker = journeyMarkers[i - 1];
      const currentMarker = journeyMarkers[i];

      // Calculate the minimum position for the current marker to respect MIN_DOT_TO_DOT_SPACING_PX.
      const minPosFromPrevDot =
        prevMarker.adjustedPositionPx + MIN_DOT_TO_DOT_SPACING_PX;

      currentMarker.adjustedPositionPx = Math.max(
        currentMarker.idealPositionPx, // Maintain time-based spread if generous enough
        minPosFromPrevDot // Enforce minimum visual gap
      );
    }

    // The final width of the timeline is determined by the last marker's position
    // plus half its label width (to ensure the label doesn't get cut off at the end).
    finalCalculatedTimelineWidthPx =
      journeyMarkers[journeyMarkers.length - 1].adjustedPositionPx +
      LABEL_WIDTH_PX / 2;
  } else {
    // Default width if no steps/markers
    finalCalculatedTimelineWidthPx = ABSOLUTE_MIN_TIMELINE_WIDTH_PX;
  }

  // Ensure the timeline always has an absolute minimum render width, regardless of calculations.
  finalCalculatedTimelineWidthPx = Math.max(
    finalCalculatedTimelineWidthPx,
    ABSOLUTE_MIN_TIMELINE_WIDTH_PX
  );

  // Create a map to quickly look up adjusted marker positions by step index for icon positioning
  const adjustedMarkerPositionsMap = new Map();
  journeyMarkers.forEach((marker) => {
    adjustedMarkerPositionsMap.set(marker.stepIndex, marker.adjustedPositionPx);
  });

  // The grey line should extend to the last marker's position
  const lineEndPositionPx =
    journeyMarkers.length > 0
      ? journeyMarkers[journeyMarkers.length - 1].adjustedPositionPx
      : 0;

  return (
    // Outer container: `ref={containerRef}` allows us to measure its actual width.
    // `w-full max-w-full`: This container will fill its parent's width without arbitrary caps.
    // `mx-auto p-4`: For centering and padding.
    // `overflow-x-auto`: Enables horizontal scrolling if the content (`inner` div) is wider.
    <div
      ref={containerRef}
      className="w-full max-w-full mx-auto p-4 overflow-x-auto"
    >
      {/* Inner timeline container: This is the actual scrollable content area. */}
      {/* `relative`: For absolute positioning of children. */}
      {/* `h-auto`: Allows vertical growth based on content, not fixed height. */}
      {/* `min-h-[160px]`: Ensures some minimum vertical space even with sparse content. */}
      <div
        className="relative h-auto flex items-center min-h-[160px]"
        style={{
          // Key to responsiveness:
          // `minWidth`: This guarantees the timeline is wide enough in pixels to
          //             1. Prevent overlap (from MIN_DOT_TO_DOT_SPACING_PX)
          //             2. Natural spread (from PIXELS_PER_MINUTE_NATURAL_SCALE)
          //             3. Stretch to fill (from TARGET_FILL_RATIO_ON_WIDE_SCREENS via containerWidth)
          // If the screen is smaller than `finalCalculatedTimelineWidthPx`, `overflow-x-auto` kicks in.
          minWidth: `${finalCalculatedTimelineWidthPx}px`,
          // `width: '100%'`: This allows the timeline to stretch to fill *its parent's width*
          //                  if the parent's width is *greater* than `minWidth`.
          //                  This means on very wide screens, if the calculated `minWidth`
          //                  is less than the actual container, it will still expand.
          width: "100%",
        }}
      >
        {/* Dynamic width for the grey timeline line, positioned to extend to the last marker. */}
        <div
          className="absolute top-1/2 -translate-y-px h-0.5 bg-gray-300 z-0"
          style={{ width: `${lineEndPositionPx}px` }}
        />

        {/* Icons and Durations */}
        {stepsWithNumericDuration.map((step, index) => {
          const startMarkerPos =
            index === 0
              ? adjustedMarkerPositionsMap.get(-1)
              : adjustedMarkerPositionsMap.get(index - 1);

          const endMarkerPos = adjustedMarkerPositionsMap.get(index);

          let iconActualPositionPx;
          if (startMarkerPos !== undefined && endMarkerPos !== undefined) {
            // Place icon at the midpoint of the *adjusted visual segment*
            iconActualPositionPx = (startMarkerPos + endMarkerPos) / 2;
          } else {
            iconActualPositionPx = 0; // Fallback
          }

          const IconComponent = getLucideIcon(step.icon);

          return (
            <div
              key={`step-icon-${index}`}
              className="absolute flex flex-col items-center"
              style={{
                left: `${iconActualPositionPx}px`, // Position in pixels
                transform: "translateX(-50%)", // Center icon over its pixel position
                top: `${ICON_TOP_OFFSET}px`, // Vertical position above the line
              }}
            >
              <IconComponent className="w-5 h-5" />
              {step.duration && (
                <span className="text-xs text-gray-600 mt-1 whitespace-nowrap">
                  {step.duration}
                </span>
              )}
            </div>
          );
        })}

        {/* Markers (circles), Address Labels, and Time Labels */}
        {journeyMarkers.map((marker, index) => {
          const isFirstMarker = index === 0;
          const isLastMarker = index === journeyMarkers.length - 1;

          let labelTransform = "translateX(-50%)"; // Default: center label horizontally on the dot
          let labelTextAlign = "text-center"; // Default: center text within label box

          // Special alignment for first and last labels to keep them within bounds and readable
          if (isFirstMarker) {
            labelTransform = "translateX(0%)"; // Align left edge of label with the dot
            labelTextAlign = "text-left";
          } else if (isLastMarker && journeyMarkers.length > 1) {
            labelTransform = "translateX(-50%)"; // Align right edge of label with the dot
            labelTextAlign = "text-center";
          }

          return (
            <React.Fragment key={`marker-fragment-${index}`}>
              {/* The actual marker dot */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full z-10"
                style={{ left: `${marker.adjustedPositionPx}px` }} // Use adjustedPositionPx
              />

              {/* Time Label (above the line) */}
              {marker.time && (
                <div
                  className={`absolute font-semibold text-xs text-gray-800 whitespace-nowrap ${labelTextAlign}`}
                  style={{
                    left: `${marker.adjustedPositionPx}px`,
                    transform: labelTransform,
                    bottom: `calc(50% + ${TIME_LABEL_BOTTOM_OFFSET}px)`, // Position above the line
                  }}
                >
                  {marker.time}
                </div>
              )}

              {/* Address Label (below the line), min-w and max-w are fixed to LABEL_WIDTH_PX */}
              <div
                className={`absolute text-[10px] text-gray-600 min-w-[${LABEL_WIDTH_PX}px] max-w-[${LABEL_WIDTH_PX}px] whitespace-normal ${labelTextAlign}`}
                style={{
                  left: `${marker.adjustedPositionPx}px`,
                  transform: labelTransform,
                  top: `calc(50% + ${ADDRESS_LABEL_TOP_OFFSET}px)`, // Position below the line
                  wordBreak: "break-word", // Ensures long words break onto new lines
                }}
              >
                <div>{marker.label}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default JourneyTimeline;
