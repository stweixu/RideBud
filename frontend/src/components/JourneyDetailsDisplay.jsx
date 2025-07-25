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

// Helper function to get Lucide icon (consider moving to utils/icons.js)
const getLucideIcon = (iconHint) => {
  switch (iconHint) {
    case "Car":
      return Car;
    case "Bus":
    case "Walk": // Assuming Walk might be visually represented by a bus for generic transit/walking
      return Bus;
    case "Train":
    case "MRT":
      return Train;
    case "FootprintsIcon": // Explicitly Footprints for walking
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

// Helper function to parse duration string to minutes (consider moving to utils/time.js)
const parseDurationToMinutes = (durationString) => {
  let totalMinutes = 0;
  const hoursMatch = durationString.match(/(\d+)\s*h/);
  const minutesMatch = durationString.match(/(\d+)\s*min/);
  if (hoursMatch) totalMinutes += parseInt(hoursMatch[1], 10) * 60;
  if (minutesMatch) totalMinutes += parseInt(minutesMatch[1], 10);
  return totalMinutes;
};

// Helper function to format time with offset (consider moving to utils/time.js)
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
// This should be in your .env file (e.g., VITE_Maps_API_KEY=YOUR_API_KEY)
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
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]); // To store all custom markers (start, end, waypoints)
  const highlightMarkerRef = useRef(null);
  const polylinesRef = useRef([]);
  const initialBoundsRef = useRef(null);

  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [highlightedStepId, setHighlightedStepId] = useState(null);

  const [coordsToHighlight, setCoordsToHighlight] = useState(null);

  const loadGoogleMapsScript = useCallback(() => {
    if (window.google?.maps) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    if (document.getElementById(MAP_SCRIPT_ID)) return; // Already loading

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

    // Clear existing markers and polylines
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

    // Helper to add markers to the map and extend bounds
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
        // Intermediate step marker (purple)
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
      bounds.extend(position); // Extend bounds for all markers
    };

    // NO initial start marker at the origin from rideRoute.origin directly.
    // The first point on the map will be the start_location of the first step,
    // which serves as the "start destination" in your new model.

    // Loop through journey steps to draw individual polylines
    let currentOrigin = rideRoute.origin; // Start with the overall origin for the first step's request

    for (let i = 0; i < journey.steps.length; i++) {
      const step = journey.steps[i];
      const stepDestination = step.end_location
        ? new window.google.maps.LatLng(
            step.end_location.lat,
            step.end_location.lng
          )
        : step.end_address;

      if (!stepDestination) {
        console.warn(
          `Step ${i} is missing end_location or end_address, skipping polyline for this step.`
        );
        currentOrigin = step.end_address || currentOrigin; // Attempt to update origin for next step
        continue;
      }

      let travelMode;
      let lineColor = TRANSPORT_COLORS.default;
      if (step.type === "driving" || step.type === "carpool") {
        travelMode = window.google.maps.TravelMode.DRIVING;
        lineColor = TRANSPORT_COLORS.carpool;
      } else if (step.type === "bus") {
        travelMode = window.google.maps.TravelMode.TRANSIT;
        lineColor = TRANSPORT_COLORS.bus;
      } else if (
        step.type === "MRT" ||
        step.type === "train" // Check for MRT/train string too
      ) {
        travelMode = window.google.maps.TravelMode.TRANSIT;
        lineColor = TRANSPORT_COLORS.train;
      } else if (step.type === "walking" || step.type === "walk") {
        travelMode = window.google.maps.TravelMode.WALKING;
        lineColor = TRANSPORT_COLORS.walking;
      } else if (step.type === "bicycling" || step.type === "bike") {
        travelMode = window.google.maps.TravelMode.BICYCLING;
        lineColor = TRANSPORT_COLORS.default; // Default for bike
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
          // If a step fails, try to use its end location as the next origin if available
          if (step.end_location) {
            currentOrigin = new window.google.maps.LatLng(
              step.end_location.lat,
              step.end_location.lng
            );
          } else {
            // If no end_location, fall back to address or just keep previous origin
            currentOrigin = step.end_address || currentOrigin;
          }
        }
      } catch (error) {
        console.error(
          `Error fetching directions for step ${i} (${step.description}):`,
          error
        );
        // Ensure currentOrigin updates even on API error to avoid infinite loop or bad origins
        if (step.end_location) {
          currentOrigin = new window.google.maps.LatLng(
            step.end_location.lat,
            step.end_location.lng
          );
        } else {
          currentOrigin = step.end_address || currentOrigin;
        }
      }

      // Update currentOrigin for the next step
      if (step.end_location) {
        currentOrigin = new window.google.maps.LatLng(
          step.end_location.lat,
          step.end_location.lng
        );
      } else if (step.end_address) {
        currentOrigin = step.end_address;
      }

      // Add marker for the *start* of the current step IF it's the first step of the journey,
      // OR if it's an intermediate step's *end* location that hasn't been marked yet.
      if (i === 0 && step.start_location) {
        // This marks the "start destination"
        addMarker(
          new window.google.maps.LatLng(
            step.start_location.lat,
            step.start_location.lng
          ),
          "start" // Use "start" type to give it the green color
        );
      } else if (step.end_location) {
        // For subsequent steps, mark their ends as intermediate points
        const isCloseToExisting = markersRef.current.some((marker) => {
          if (marker.getPosition()) {
            const distance =
              window.google.maps.geometry.spherical.computeDistanceBetween(
                new window.google.maps.LatLng(
                  step.end_location.lat,
                  step.end_location.lng
                ),
                marker.getPosition()
              );
            return distance < 50; // Within 50 meters to avoid duplicate markers at same spot
          }
          return false;
        });
        if (!isCloseToExisting && i < journey.steps.length - 1) {
          // Only add intermediate marker if not last step's end
          addMarker(
            new window.google.maps.LatLng(
              step.end_location.lat,
              step.end_location.lng
            ),
            "step" // Use "step" type for intermediate purple markers
          );
        }
      }
    }

    // Add end marker at the overall destination (last step's end_location)
    const lastStep = journey.steps[journey.steps.length - 1];
    if (lastStep && lastStep.end_location) {
      const endLoc = new window.google.maps.LatLng(
        lastStep.end_location.lat,
        lastStep.end_location.lng
      );
      addMarker(endLoc, "end");
    } else {
      // Fallback for destination address if last step has no end_location
      directionsService.route(
        {
          origin: rideRoute.destination,
          destination: rideRoute.destination, // Just to get coordinates for the destination
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
          if (status === "OK" && response.routes[0]) {
            addMarker(response.routes[0].legs[0].start_location, "end");
          } else {
            console.warn("Could not geocode destination for end marker.");
          }
        }
      );
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
      initialBoundsRef.current = bounds;
    } else {
      // Fallback if no valid steps or bounds could be computed
      map.setCenter({ lat: 1.3521, lng: 103.8198 });
      map.setZoom(10);
      setMapError("No valid route information to display.");
    }

    setMapLoaded(true);
    setMapLoading(false);
  }, [journey, rideRoute]);

  // Effect to load script and draw map initially
  useEffect(() => {
    setMapLoaded(false);
    setMapLoading(true);
    setMapError(null);
    setCoordsToHighlight(null);
    setHighlightedStepId(null);
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    initialBoundsRef.current = null;

    loadGoogleMapsScript(); // just load script; draw in next effect
  }, [journey, rideRoute, loadGoogleMapsScript]);

  useEffect(() => {
    if (isGoogleMapsLoaded && journey && rideRoute && mapRef.current) {
      drawMapRoute();
    }
  }, [isGoogleMapsLoaded, journey, rideRoute, drawMapRoute]);

  // Effect for ResizeObserver (to handle container resizing)
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
              // Only re-fit bounds if no specific step is highlighted,
              // or pan to highlighted coordinate after resize
              if (coordsToHighlight) {
                map.panTo(coordsToHighlight);
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
  }, [mapLoaded, coordsToHighlight]); // Depend on mapLoaded and coordsToHighlight

  // Effect to handle highlighting on the map
  useEffect(() => {
    if (!window.google || !window.google.maps || !mapInstanceRef.current)
      return;

    const map = mapInstanceRef.current;

    if (coordsToHighlight) {
      if (!highlightMarkerRef.current) {
        highlightMarkerRef.current = new window.google.maps.Marker({
          map: map,
          animation: window.google.maps.Animation.DROP, // Drop animation
        });
      }
      highlightMarkerRef.current.setPosition(coordsToHighlight);
      highlightMarkerRef.current.setMap(map);
      map.panTo(coordsToHighlight);
      map.setZoom(12.5); // Zoom in when highlighting a specific step
    } else {
      if (highlightMarkerRef.current) {
        highlightMarkerRef.current.setMap(null);
      }
      // Reset map view to overall route bounds if no step is highlighted
      if (mapLoaded && mapInstanceRef.current && initialBoundsRef.current) {
        mapInstanceRef.current.fitBounds(initialBoundsRef.current);
      }
    }
  }, [coordsToHighlight, mapLoaded]);

  const handleStepHover = useCallback(
    (step, index) => {
      // Determine the coordinate to highlight based on the step type or details
      let highlightCoord = null;
      // For the first logical point (the start of the first step)
      if (index === 0 && step.start_location) {
        highlightCoord = new window.google.maps.LatLng(
          step.start_location.lat,
          step.start_location.lng
        );
      } else if (step.end_location) {
        // For intermediate step ends and overall end
        highlightCoord = new window.google.maps.LatLng(
          step.end_location.lat,
          step.end_location.lng
        );
      } else if (step.start_address) {
        // Fallback if no precise coordinates, though precise coords are preferred for map interaction
        console.warn(
          "No precise start_location/end_location for step hover, falling back to address string."
        );
      }

      if (highlightCoord) {
        setCoordsToHighlight(highlightCoord);
        setHighlightedStepId(step.id || `${step.description}-${index}`);
      }
    },
    [] // No dependency on journey.steps needed here as step object is passed directly
  );

  const handleStepLeave = useCallback(() => {
    setCoordsToHighlight(null);
    setHighlightedStepId(null);
  }, []);

  const handleStepClick = useCallback(
    (step, index) => {
      // Currently, click has the same effect as hover for highlighting.
      // You could expand this for more detailed info or interactions.
      handleStepHover(step, index);
    },
    [handleStepHover]
  );

  let cumulativeTimeInMinutes = 0;
  const steps = journey.steps || [];

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

              {/* Start Point - Now represents the start of the first journey step, colored green */}
              <div
                className={`flex items-start gap-3 relative pb-4 cursor-pointer transition-all duration-200 ${
                  highlightedStepId === `start-${rideRoute.origin}`
                    ? "bg-blue-50 border-l-4 border-blue-500 rounded-lg p-2 -ml-2"
                    : ""
                }`}
                onMouseEnter={() => {
                  if (journey.steps && journey.steps[0]?.start_location) {
                    setCoordsToHighlight(
                      new window.google.maps.LatLng(
                        journey.steps[0].start_location.lat,
                        journey.steps[0].start_location.lng
                      )
                    );
                    setHighlightedStepId(`start-${rideRoute.origin}`);
                  }
                }}
                onMouseLeave={handleStepLeave}
                onClick={() => {
                  if (journey.steps && journey.steps[0]?.start_location) {
                    setCoordsToHighlight(
                      new window.google.maps.LatLng(
                        journey.steps[0].start_location.lat,
                        journey.steps[0].start_location.lng
                      )
                    );
                    setHighlightedStepId(`start-${rideRoute.origin}`);
                  }
                }}
              >
                {/* Vertical line for connecting start to first step */}
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

              {/* Individual Steps (now using StepDetailRow) */}
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
                    isHighlighted={highlightedStepId === uniqueStepId}
                    formatTimeWithOffset={formatTimeWithOffset}
                    getLucideIcon={getLucideIcon} // Pass helper function
                  />
                );
              })}

              {/* End Point (Overall Journey Destination) */}
              <div
                className={`flex items-start gap-3 relative cursor-pointer transition-all duration-200 ${
                  highlightedStepId === `end-${rideRoute.destination}`
                    ? "bg-blue-50 border-l-4 border-blue-500 rounded-lg p-2 -ml-2"
                    : ""
                }`}
                onMouseEnter={() => {
                  // For the overall end point, highlight its end location, which is from the last step
                  if (
                    journey.steps &&
                    journey.steps[journey.steps.length - 1]?.end_location
                  ) {
                    setCoordsToHighlight(
                      new window.google.maps.LatLng(
                        journey.steps[
                          journey.steps.length - 1
                        ].end_location.lat,
                        journey.steps[journey.steps.length - 1].end_location.lng
                      )
                    );
                    setHighlightedStepId(`end-${rideRoute.destination}`);
                  }
                }}
                onMouseLeave={handleStepLeave}
                onClick={() => {
                  if (
                    journey.steps &&
                    journey.steps[journey.steps.length - 1]?.end_location
                  ) {
                    setCoordsToHighlight(
                      new window.google.maps.LatLng(
                        journey.steps[
                          journey.steps.length - 1
                        ].end_location.lat,
                        journey.steps[journey.steps.length - 1].end_location.lng
                      )
                    );
                    setHighlightedStepId(`end-${rideRoute.destination}`);
                  }
                }}
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
