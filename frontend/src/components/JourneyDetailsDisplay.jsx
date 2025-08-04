// src/components/JourneyDetailsDisplay.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Clock,
  DollarSign,
  Car,
  Train,
  Bus,
  FootprintsIcon,
  MapPin,
  Ruler,
  Bike,
  Navigation,
  Loader2, // For internal map loading spinner
  Frown,
  Users, // For map error icon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StepDetailRow from "./StepDetailRow"; // Ensure this path is correct

// IMPORTANT: Move these helper functions to a shared utils file (e.g., src/utils/helpers.js)
// and import them here to avoid duplication and improve maintainability.

/**
 * Helper function to get Lucide icon based on a hint.
 * @param {string} iconHint The string hint for the icon.
 * @returns {React.Component} The Lucide React component for the icon.
 */
const getLucideIcon = (iconHint) => {
  switch (iconHint) {
    case "Car":
      return Car;
    case "Bus":
    case "Walk":
      return Bus;
    case "Train":
    case "MRT":
      return Train;
    case "FootprintsIcon":
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

/**
 * Helper function to parse a duration string (e.g., "40 min", "1 h 30 min") to total minutes.
 * @param {string} durationString The duration string to parse.
 * @returns {number} The total duration in minutes.
 */
const parseDurationToMinutes = (durationString) => {
  let totalMinutes = 0;
  const hoursMatch = durationString.match(/(\d+)\s*h/);
  const minutesMatch = durationString.match(/(\d+)\s*min/);
  if (hoursMatch) totalMinutes += parseInt(hoursMatch[1], 10) * 60;
  if (minutesMatch) totalMinutes += parseInt(minutesMatch[1], 10);
  return totalMinutes;
};

/**
 * Helper function to format a time with a minutes offset.
 * @param {string|Date} initialTime The starting time.
 * @param {number} offsetMinutes The minutes to add to the initial time.
 * @returns {string} The formatted time string.
 */
const formatTimeWithOffset = (initialTime, offsetMinutes) => {
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

/**
 * Helper function to get a Google Maps LatLng object from various location data formats.
 * This function handles both the `coordinates` array format and the `lat`/`lng` object format.
 * @param {object} location The location object from the journey data.
 * @returns {google.maps.LatLng | null} A Google Maps LatLng object or null if data is invalid.
 */
const getCoordinatesFromLocation = (location) => {
  if (!location) return null;

  let lat, lng;
  if (
    location.coordinates &&
    Array.isArray(location.coordinates) &&
    location.coordinates.length === 2
  ) {
    // Case: coordinates array [lng, lat]
    [lng, lat] = location.coordinates;
  } else if (
    typeof location.lat === "number" &&
    typeof location.lng === "number"
  ) {
    // Case: lat/lng object
    lat = location.lat;
    lng = location.lng;
  } else {
    return null;
  }

  // Final validation to ensure coordinates are valid numbers
  if (
    typeof lat === "number" &&
    isFinite(lat) &&
    typeof lng === "number" &&
    isFinite(lng)
  ) {
    return new window.google.maps.LatLng(lat, lng);
  }

  return null;
};

// Define colors for different transport modes
const TRANSPORT_COLORS = {
  walking: "#007BFF", // Blue
  carpool: "#28A745", // Green
  bus: "#FFC107", // Yellow/Orange
  train: "#DC3545", // Red
  mrt: "#DC3545", // Red (assuming MRT is a type of train)
  default: "#6C757D", // Grey for unknown/other
};

// Google Maps API Key - IMPORTANT: Ensure this is correctly configured
const Maps_API_KEY = import.meta.env.VITE_Maps_API_KEY;
const MAP_SCRIPT_ID = "google-maps-script-journey-details";

const JourneyDetailsDisplay = ({
  journey,
  rideRoute,
  startTime,
  showSelectionButton = false,
  isSelectingJourney = false,
  onSelectJourney,
  selectionError = null,
  selectionSuccess = null,
  isAuthenticated,
  carpoolRideDetails,
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const highlightMarkerRef = useRef(null);
  const polylinesRef = useRef([]);
  const initialBoundsRef = useRef(null);

  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [highlightedStepId, setHighlightedStepId] = useState(null);
  const [clickedStepId, setClickedStepId] = useState(null);

  const steps = journey.steps || [];

  const loadGoogleMapsScript = useCallback(() => {
    if (window.google?.maps) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    if (document.getElementById(MAP_SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = MAP_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${Maps_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("Google Maps script loaded.");
      setIsGoogleMapsLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps script.");
      setMapError("Failed to load map resources. Please try again.");
      setMapLoading(false);
    };

    document.head.appendChild(script);
  }, [Maps_API_KEY]);

  const drawMapRoute = useCallback(async () => {
    if (!window.google || !window.google.maps || !mapRef.current) {
      setMapError(
        "Google Maps API not fully available or map container not ready."
      );
      setMapLoading(false);
      return;
    }

    if (!steps || steps.length === 0) {
      setMapError("No route information available to display.");
      setMapLoading(false);
      return;
    }

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 10,
        center: { lat: 1.3521, lng: 103.8198 }, // Default center (Singapore)
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        zoomControl: true,
      });
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    if (highlightMarkerRef.current) {
      highlightMarkerRef.current.setMap(null);
      highlightMarkerRef.current = null;
    }
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];

    const map = mapInstanceRef.current;
    const directionsService = new window.google.maps.DirectionsService();
    const bounds = new window.google.maps.LatLngBounds();

    const addMarker = (position, type) => {
      let iconOptions = {};
      if (type === "start") {
        iconOptions = {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#10B981", // Green
          fillOpacity: 1,
          strokeColor: "#065F46",
          strokeWeight: 2,
          scale: 8,
        };
      } else if (type === "end") {
        iconOptions = {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#EF4444", // Red
          fillOpacity: 1,
          strokeColor: "#B91C1C",
          strokeWeight: 2,
          scale: 8,
        };
      } else {
        iconOptions = {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#8B5CF6", // Purple
          fillOpacity: 0.7,
          strokeColor: "#6D28D9",
          strokeWeight: 1,
          scale: 4,
        };
      }

      const marker = new window.google.maps.Marker({
        position: position,
        map: map,
        icon: iconOptions,
        title: type === "start" ? "Start" : type === "end" ? "End" : "Step",
      });
      markersRef.current.push(marker);
      bounds.extend(position);
    };

    let currentOrigin = getCoordinatesFromLocation(steps[0].start_location);

    if (!currentOrigin) {
      console.warn("No valid origin coordinates to start the route.");
      setMapError("No valid origin to start the route.");
      setMapLoading(false);
      return;
    }
    addMarker(currentOrigin, "start");

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      let stepDestination = getCoordinatesFromLocation(step.end_location);

      if (!stepDestination) {
        console.warn(
          `Invalid end coordinates for step ${i}. Skipping polyline.`
        );
        currentOrigin = getCoordinatesFromLocation(step.start_location);
        continue;
      }

      let travelMode;
      let lineColor = TRANSPORT_COLORS.default;
      if (step.type === "driving" || step.type === "carpool") {
        travelMode = window.google.maps.TravelMode.DRIVING;
        lineColor = TRANSPORT_COLORS.carpool;
      } else if (
        step.type === "bus" ||
        step.type === "MRT" ||
        step.type === "train"
      ) {
        travelMode = window.google.maps.TravelMode.TRANSIT;
        lineColor = TRANSPORT_COLORS.bus;
      } else if (step.type === "walking" || step.type === "walk") {
        travelMode = window.google.maps.TravelMode.WALKING;
        lineColor = TRANSPORT_COLORS.walking;
      } else if (step.type === "bicycling" || step.type === "bike") {
        travelMode = window.google.maps.TravelMode.BICYCLING;
        lineColor = TRANSPORT_COLORS.default;
      } else {
        travelMode = window.google.maps.TravelMode.DRIVING;
        lineColor = TRANSPORT_COLORS.default;
      }

      try {
        const result = await directionsService.route({
          origin: currentOrigin,
          destination: stepDestination,
          travelMode: travelMode,
          unitSystem: window.google.maps.UnitSystem.METRIC,
        });

        if (result.status === "OK") {
          const path = result.routes[0].overview_path;
          const polyline = new window.google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: lineColor,
            strokeOpacity: 0.8,
            strokeWeight: 6,
            map: map,
          });
          polylinesRef.current.push(polyline);
          result.routes[0].legs.forEach((leg) => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
        } else {
          console.warn(
            `Directions request failed for step ${i} (${step.description}): ${result.status}`
          );
        }
      } catch (error) {
        console.error(
          `Error fetching directions for step ${i} (${step.description}):`,
          error
        );
      }

      currentOrigin = stepDestination;

      if (i < steps.length - 1) {
        if (stepDestination) {
          const isCloseToExisting = markersRef.current.some((marker) => {
            if (marker.getPosition()) {
              const distance =
                window.google.maps.geometry.spherical.computeDistanceBetween(
                  stepDestination,
                  marker.getPosition()
                );
              return distance < 50;
            }
            return false;
          });
          if (!isCloseToExisting) {
            addMarker(stepDestination, "step");
          }
        }
      }
    }

    const lastStep = steps[steps.length - 1];
    const finalDestination = getCoordinatesFromLocation(lastStep?.end_location);
    if (finalDestination) {
      addMarker(finalDestination, "end");
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
      initialBoundsRef.current = bounds;
    } else {
      map.setCenter({ lat: 1.3521, lng: 103.8198 });
      map.setZoom(10);
      setMapError("No valid route information to display.");
    }

    setMapLoaded(true);
    setMapLoading(false);
  }, [steps, rideRoute]);

  useEffect(() => {
    setMapLoaded(false);
    setMapLoading(true);
    setMapError(null);
    setHighlightedStepId(null);
    setClickedStepId(null);
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    initialBoundsRef.current = null;

    loadGoogleMapsScript();
  }, [journey, rideRoute, loadGoogleMapsScript]);

  useEffect(() => {
    if (isGoogleMapsLoaded && journey && rideRoute && mapRef.current) {
      drawMapRoute();
    }
  }, [isGoogleMapsLoaded, journey, rideRoute, drawMapRoute]);

  useEffect(() => {
    const currentMapRef = mapRef.current;
    if (!currentMapRef || !window.google || !window.google.maps) return;

    const map = mapInstanceRef.current;

    const resizeObserver = new ResizeObserver((entries) => {
      if (map && mapLoaded) {
        for (let entry of entries) {
          if (entry.target === currentMapRef) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
              window.google.maps.event.trigger(map, "resize");

              let targetCoords = null;
              if (clickedStepId) {
                if (clickedStepId.startsWith("start-")) {
                  const firstStep = steps[0];
                  targetCoords = getCoordinatesFromLocation(
                    firstStep?.start_location
                  );
                } else if (clickedStepId.startsWith("end-")) {
                  const lastStep = steps[steps.length - 1];
                  targetCoords = getCoordinatesFromLocation(
                    lastStep?.end_location
                  );
                } else {
                  const targetStep = steps.find(
                    (step, index) =>
                      `${step.description}-${index}` === clickedStepId
                  );
                  if (targetStep) {
                    targetCoords = getCoordinatesFromLocation(
                      targetStep?.end_location
                    );
                    if (!targetCoords) {
                      targetCoords = getCoordinatesFromLocation(
                        targetStep?.start_location
                      );
                    }
                  }
                }
              }

              if (targetCoords) {
                map.panTo(targetCoords);
              } else if (initialBoundsRef.current) {
                map.fitBounds(initialBoundsRef.current);
              }
            }
          }
        }
      }
    });

    resizeObserver.observe(currentMapRef);

    return () => {
      if (currentMapRef) {
        resizeObserver.unobserve(currentMapRef);
      }
    };
  }, [mapLoaded, clickedStepId, journey, steps]);

  useEffect(() => {
    if (!window.google || !window.google.maps || !mapInstanceRef.current)
      return;

    const map = mapInstanceRef.current;

    let currentHighlightCoords = null;
    let targetId = clickedStepId || highlightedStepId;

    if (targetId) {
      if (targetId.startsWith("start-")) {
        const firstStep = steps[0];
        currentHighlightCoords = getCoordinatesFromLocation(
          firstStep?.start_location
        );
      } else if (targetId.startsWith("end-")) {
        const lastStep = steps[steps.length - 1];
        currentHighlightCoords = getCoordinatesFromLocation(
          lastStep?.end_location
        );
      } else {
        const targetStep = steps.find(
          (step, index) => `${step.description}-${index}` === targetId
        );
        if (targetStep) {
          currentHighlightCoords = getCoordinatesFromLocation(
            targetStep?.end_location
          );
          if (!currentHighlightCoords) {
            currentHighlightCoords = getCoordinatesFromLocation(
              targetStep?.start_location
            );
          }
        }
      }
    }

    if (currentHighlightCoords) {
      if (!highlightMarkerRef.current) {
        highlightMarkerRef.current = new window.google.maps.Marker({
          map: map,
          animation: window.google.maps.Animation.DROP,
        });
      }
      highlightMarkerRef.current.setPosition(currentHighlightCoords);
      highlightMarkerRef.current.setMap(map);
      map.panTo(currentHighlightCoords);
      map.setZoom(12.5);
    } else {
      if (highlightMarkerRef.current) {
        highlightMarkerRef.current.setMap(null);
      }
      if (
        mapLoaded &&
        mapInstanceRef.current &&
        initialBoundsRef.current &&
        !clickedStepId
      ) {
        mapInstanceRef.current.fitBounds(initialBoundsRef.current);
      }
    }
  }, [clickedStepId, highlightedStepId, journey, mapLoaded, steps]);

  const handleStepHover = useCallback(
    (step, index) => {
      if (clickedStepId) {
        return;
      }

      const uniqueStepId = `${step.description}-${index}`;
      const highlightCoord =
        getCoordinatesFromLocation(step?.end_location) ||
        getCoordinatesFromLocation(step?.start_location);

      if (highlightCoord) {
        setHighlightedStepId(uniqueStepId);
      }
    },
    [clickedStepId]
  );

  const handleStepLeave = useCallback(() => {
    if (clickedStepId) {
      return;
    }
    setHighlightedStepId(null);
  }, [clickedStepId]);

  const handleStepClick = useCallback(
    (step, index) => {
      const uniqueStepId = `${step.description}-${index}`;
      const targetCoords =
        getCoordinatesFromLocation(step?.end_location) ||
        getCoordinatesFromLocation(step?.start_location);

      if (clickedStepId === uniqueStepId) {
        setClickedStepId(null);
        setHighlightedStepId(null);
      } else {
        if (targetCoords) {
          setClickedStepId(uniqueStepId);
          setHighlightedStepId(uniqueStepId);
        } else {
          console.warn(
            `Could not get valid coordinates for clicked step: ${uniqueStepId}`
          );
        }
      }
    },
    [clickedStepId]
  );

  const handleStartJourneyClick = useCallback(() => {
    const firstStep = steps[0];
    const startCoords = getCoordinatesFromLocation(firstStep?.start_location);
    const uniqueId = `start-${rideRoute.origin}`;

    if (clickedStepId === uniqueId) {
      setClickedStepId(null);
      setHighlightedStepId(null);
    } else {
      if (startCoords) {
        setClickedStepId(uniqueId);
        setHighlightedStepId(uniqueId);
      } else {
        console.warn("Could not get valid coordinates for start journey.");
      }
    }
  }, [clickedStepId, rideRoute.origin, steps]);

  const handleEndJourneyClick = useCallback(() => {
    const lastStep = steps[steps.length - 1];
    const endCoords = getCoordinatesFromLocation(lastStep?.end_location);
    const uniqueId = `end-${rideRoute.destination}`;

    if (clickedStepId === uniqueId) {
      setClickedStepId(null);
      setHighlightedStepId(null);
    } else {
      if (endCoords) {
        setClickedStepId(uniqueId);
        setHighlightedStepId(uniqueId);
      } else {
        console.warn("Could not get valid coordinates for end journey.");
      }
    }
  }, [clickedStepId, rideRoute.destination, steps]);

  let cumulativeTimeInMinutes = 0;

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      <div className="w-full md:w-1/3 flex-shrink-0">
        <Card className="shadow-sm h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Selected Journey Details
            </CardTitle>
            <div className="text-sm text-gray-600 mt-2">
              <strong>Route:</strong> {rideRoute.origin} →{" "}
              {rideRoute.destination}
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    {journey.totalTime}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {journey.totalCostPerPax}
                  </span>
                </div>

                {journey.totalDistance && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">
                      {journey.totalDistance}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-black" />
                  <span className="text-sm font-medium">
                    {journey.passengersCount} passenger
                    {journey.passengersCount > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-black" />
                  <span className="text-sm font-medium">
                    Total: {journey.carpoolRideCost}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-3 border-t pt-4">
              <h4 className="font-medium text-gray-700 border-b pb-2 mb-2">
                Detailed Journey Timeline:
              </h4>

              <div
                className={`flex items-start gap-3 relative pb-4 cursor-pointer transition-all duration-200 ${
                  highlightedStepId === `start-${rideRoute.origin}` ||
                  clickedStepId === `start-${rideRoute.origin}`
                    ? "bg-blue-50 border-l-4 border-blue-500 rounded-lg p-2 -ml-2"
                    : ""
                }`}
                onMouseEnter={() => {
                  if (
                    !clickedStepId &&
                    journey.steps &&
                    getCoordinatesFromLocation(journey.steps[0]?.start_location)
                  ) {
                    setHighlightedStepId(`start-${rideRoute.origin}`);
                  }
                }}
                onMouseLeave={handleStepLeave}
                onClick={handleStartJourneyClick}
              >
                {steps.length > 0 && (
                  <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gray-300 border-l border-dashed border-gray-400"></div>
                )}
                <div className="flex-shrink-0 size-10 flex items-center justify-center bg-green-600 rounded-full text-white z-10 shadow-md">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-grow space-y-0.5">
                  <p className="text-sm text-gray-500 font-semibold">
                    Start Journey
                  </p>
                  <p className="font-medium text-gray-800">
                    {rideRoute.origin}
                  </p>
                  <p className="text-xs text-gray-500">
                    Time: {formatTimeWithOffset(startTime, 0)}
                  </p>
                </div>
              </div>

              {steps.map((step, index) => {
                const currentDuration = parseDurationToMinutes(step.duration);
                cumulativeTimeInMinutes += isNaN(currentDuration)
                  ? 0
                  : currentDuration;
                const uniqueStepId = `${step.description}-${index}`;

                return (
                  <StepDetailRow
                    key={uniqueStepId}
                    step={step}
                    steps={steps}
                    index={index}
                    isLastStepInList={index === steps.length - 1}
                    cumulativeTimeInMinutes={cumulativeTimeInMinutes}
                    startTime={startTime}
                    onHoverStep={(s) => handleStepHover(s, index)}
                    onLeaveStep={handleStepLeave}
                    onClickStep={(s) => handleStepClick(s, index)}
                    isHighlighted={
                      highlightedStepId === uniqueStepId ||
                      clickedStepId === uniqueStepId
                    }
                    formatTimeWithOffset={formatTimeWithOffset}
                    getLucideIcon={getLucideIcon}
                  />
                );
              })}

              <div
                className={`flex items-start gap-3 relative cursor-pointer transition-all duration-200 ${
                  highlightedStepId === `end-${rideRoute.destination}` ||
                  clickedStepId === `end-${rideRoute.destination}`
                    ? "bg-blue-50 border-l-4 border-blue-500 rounded-lg p-2 -ml-2"
                    : ""
                }`}
                onMouseEnter={() => {
                  if (
                    !clickedStepId &&
                    journey.steps &&
                    getCoordinatesFromLocation(
                      journey.steps[journey.steps.length - 1]?.end_location
                    )
                  ) {
                    setHighlightedStepId(`end-${rideRoute.destination}`);
                  }
                }}
                onMouseLeave={handleStepLeave}
                onClick={handleEndJourneyClick}
              >
                <div className="flex-shrink-0 size-10 flex items-center justify-center bg-red-600 rounded-full text-white z-10 shadow-md">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-grow space-y-0.5">
                  <p className="text-sm text-gray-500 font-semibold">
                    End Journey
                  </p>
                  <p className="font-medium text-gray-800">
                    {rideRoute.destination}
                  </p>
                  <p className="text-xs text-gray-500">
                    Time:{" "}
                    {formatTimeWithOffset(startTime, cumulativeTimeInMinutes)}
                  </p>
                </div>
              </div>
            </div>
            {showSelectionButton && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => onSelectJourney(journey)}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 m-3"
                  disabled={isSelectingJourney || !isAuthenticated}
                >
                  {isSelectingJourney ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Selecting...
                    </>
                  ) : (
                    "Select This Journey"
                  )}
                </Button>
              </div>
            )}

            <div>
              {" "}
              {showSelectionButton && selectionError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm mb-4">
                  {selectionError}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="w-full md:w-2/3 flex-grow bg-gray-200 rounded-lg shadow-sm overflow-hidden relative min-h-[400px]">
        {mapLoading && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-gray-100 bg-opacity-75 z-20 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <p className="text-gray-700 mt-2">Loading Map...</p>
          </div>
        )}
        {mapError && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-red-50 bg-opacity-75 z-20 rounded-lg p-4 text-red-700 text-center">
            <Frown className="h-8 w-8 mb-2" />
            <p>{mapError}</p>
            <p className="text-xs mt-1">Check console for details.</p>
          </div>
        )}
        <div
          ref={mapRef}
          className="w-full h-full"
          aria-label="Google Map displaying the selected journey route"
        >
          {/* Google Map will be rendered here */}
        </div>
      </div>
    </div>
  );
};

export default JourneyDetailsDisplay;
