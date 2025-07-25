// src/utils/journeyHelpers.js
import {
  Car,
  Train,
  Bus,
  FootprintsIcon,
  Bike,
  Navigation,
  MapPin,
  Ship, // Added for ferry
  CableCar, // Added for gondola/funicular/cable_car
} from "lucide-react";

export const getLucideIcon = (iconHint) => {
  const normalizedHint = iconHint ? String(iconHint).toLowerCase() : "default";

  switch (normalizedHint) {
    case "car":
    case "carpool":
    case "driving":
      return Car;
    case "bus":
      return Bus;
    case "train":
    case "mrt":
    case "subway":
    case "heavy_rail":
    case "commuter_train": // Common Google Maps transit type
      return Train;
    case "footprintsicon":
    case "walk":
    case "walking":
      return FootprintsIcon;
    case "bike":
    case "bicycling":
    case "bicycle":
      return Bike;
    case "navigation":
      return Navigation;
    case "light_rail":
    case "tram":
      return Tram; // Use Tram icon for light rail/tram
    case "ferry":
      return Ship; // Use Ship icon for ferry
    case "gondola":
    case "funicular":
    case "cable_car":
      return CableCar; // Use CableCar icon for these types
    default:
      return MapPin; // Default to MapPin if no specific icon
  }
};

export const parseDurationToMinutes = (durationString) => {
  let totalMinutes = 0;
  const hoursMatch = durationString.match(/(\d+)\s*h/);
  const minutesMatch = durationString.match(/(\d+)\s*min/);
  if (hoursMatch) totalMinutes += parseInt(hoursMatch[1], 10) * 60;
  if (minutesMatch) totalMinutes += parseInt(minutesMatch[1], 10);
  return totalMinutes;
};

export const formatTimeWithOffset = (initialTime, offsetMinutes) => {
  if (!initialTime) return "N/A";
  let date;
  if (typeof initialTime === "string") {
    date = new Date(initialTime);
  } else if (initialTime instanceof Date) {
    date = new Date(initialTime);
  } else {
    return "Invalid Date";
  }
  if (isNaN(date.getTime())) return "Invalid Date";
  date.setMinutes(date.getMinutes() + offsetMinutes);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Define colors for different transport modes
export const TRANSPORT_COLORS = {
  walking: "#007BFF", // Blue
  carpool: "#28A745", // Green
  driving: "#28A745", // Driving often implies car, similar to carpool
  bus: "#FFC107", // Yellow/Orange
  train: "#DC3545", // Red
  mrt: "#DC3545", // Red (assuming MRT is a type of train)
  subway: "#DC3545", // Red (for Google Maps transit type)
  heavy_rail: "#DC3545",
  commuter_train: "#DC3545",
  light_rail: "#DC3545", // Light rail can also be red/similar to train
  tram: "#DC3545", // Tram can also be red/similar to train
  ferry: "#17A2B8", // Teal/Cyan for water transport
  gondola: "#6F42C1", // Purple
  funicular: "#6F42C1", // Purple
  cable_car: "#6F42C1", // Purple
  bicycling: "#6C757D", // Grey for bike
  default: "#6C757D", // Grey for unknown/other
};

// New helper function to get transport color safely
export const getTransportColor = (mode) => {
  const normalizedMode = mode ? String(mode).toLowerCase() : "default";
  // Check for transit vehicle types first if mode is 'transit'
  if (
    normalizedMode === "transit" &&
    mode.transit_details?.line?.vehicle?.type
  ) {
    const vehicleType = String(
      mode.transit_details.line.vehicle.type
    ).toLowerCase();
    return TRANSPORT_COLORS[vehicleType] || TRANSPORT_COLORS.default;
  }
  return TRANSPORT_COLORS[normalizedMode] || TRANSPORT_COLORS.default;
};
