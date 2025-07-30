// controllers/recommendationsController.js
const UserJourney = require("../models/UserJourney");
const { findBalancedRide } = require("./RideMatchingController");
const { calculateTransportCost } = require("../utility/transportCalculator");

const Maps_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!Maps_API_KEY) {
  console.error(
    "SERVER ERROR: Maps_API_KEY is not set in environment variables for the backend."
  );
}

const parseDurationToMinutes = (durationString) => {
  if (!durationString) return 0;
  const hourMatch = durationString.match(/(\d+)\s*h/);
  const minMatch = durationString.match(/(\d+)\s*min/);
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
  return hours * 60 + minutes;
};

// ADDED: Helper to parse distance text into kilometers (copied from RideMatchingController)
const parseDistanceToKm = (distanceText) => {
  if (!distanceText) return 0;

  const matchKm = distanceText.match(/(\d+(\.\d+)?)\s*km/i);
  if (matchKm) {
    return parseFloat(matchKm[1]);
  }

  const matchM = distanceText.match(/(\d+(\.\d+)?)\s*m/i);
  if (matchM) {
    return parseFloat(matchM[1]) / 1000;
  }

  return 0;
};

const calculateETA = (startTime, addMinutes) => {
  if (!startTime || addMinutes == null) return "N/A";

  try {
    let date;
    if (typeof startTime === "string") {
      // This path is primarily for parsing "HH:MM am/pm"
      // For ISO strings, new Date(string) is preferred.
      // If startTime is an ISO string, new Date(startTime) handles it
      date = new Date(startTime);
      if (isNaN(date.getTime())) {
        // If new Date(string) failed, try old HH:MM parsing
        const now = new Date();
        const [timePart, ampmPart] = startTime.split(" ");
        let [hours, minutes] = timePart.split(":").map(Number);

        if (ampmPart && ampmPart.toLowerCase() === "pm" && hours < 12) {
          hours += 12;
        } else if (
          ampmPart &&
          ampmPart.toLowerCase() === "am" &&
          hours === 12
        ) {
          hours = 0; // 12 AM (midnight)
        }
        date = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hours,
          minutes,
          0,
          0
        );
      }
    } else if (startTime instanceof Date) {
      date = new Date(startTime); // If it's already a Date object, use it directly
    } else {
      return "N/A";
    }

    if (isNaN(date.getTime())) return "N/A";

    date.setMinutes(date.getMinutes() + addMinutes);

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    console.error("Error calculating ETA:", e);
    return "N/A";
  }
};

const getStepTypeAndIconHint = (step, mode) => {
  if (mode === "DRIVING") {
    return { type: "carpool", iconHint: "Car", calculatorType: "taxi" };
  }
  if (mode === "TRANSIT") {
    if (step.travel_mode === "WALKING") {
      // Walking connected to a transit segment (e.g., to/from station)
      return {
        type: "walking",
        iconHint: "FootprintsIcon",
        calculatorType: "bus/train", // Walking to/from a transit point is part of the overall transit cost
      };
    }
    if (step.travel_mode === "TRANSIT" && step.transit_details) {
      const vehicleType = step.transit_details.line.vehicle.type.toLowerCase();
      if (vehicleType.includes("bus"))
        return { type: "bus", iconHint: "Bus", calculatorType: "bus/train" };
      if (
        vehicleType.includes("train") ||
        vehicleType.includes("subway") ||
        vehicleType.includes("rail") ||
        vehicleType.includes("tram") ||
        vehicleType.includes("mrt") // Added MRT specific check for Singapore
      )
        return {
          type: "train",
          iconHint: "Train",
          calculatorType: "bus/train",
        };
    }
    return {
      type: "public_transport",
      iconHint: "Bus",
      calculatorType: "bus/train",
    }; // Fallback
  }
  if (mode === "WALKING") {
    return {
      type: "walking",
      iconHint: "FootprintsIcon",
      calculatorType: "walking", // Walking as a primary mode is usually free
    };
  }
  if (mode === "BICYCLING") {
    return { type: "bicycling", iconHint: "Bike", calculatorType: "bicycling" }; // Bicycling might have rental cost, but assume free for now if not specified
  }
  return {
    type: "unknown",
    iconHint: "Navigation",
    calculatorType: "other",
  };
};

/**
 * Helper function to normalize location objects to { lat: number, lng: number } format.
 * Handles Google Maps LatLng objects (with .lat()/.lng() methods),
 * LatLngLiteral objects ({lat, lng}), and GeoJSON Point objects ([longitude, latitude]).
 * @param {object | null | undefined} location - The raw location object.
 * @returns {object | null} An object with { lat, lng } properties, or null if invalid.
 */
const getLatLngFromLocation = (location) => {
  if (!location) return null;

  // Case 1: Already in {lat, lng} format (e.g., from Google Directions API or directly set)
  if (
    typeof location.lat === "number" &&
    typeof location.lng === "number" &&
    isFinite(location.lat) &&
    isFinite(location.lng)
  ) {
    return { lat: location.lat, lng: location.lng };
  }

  // Case 2: GeoJSON Point format [longitude, latitude]
  // This is common for database-stored coordinates or ride-matching results.
  if (
    location.type === "Point" &&
    Array.isArray(location.coordinates) &&
    location.coordinates.length === 2
  ) {
    const [lng, lat] = location.coordinates;
    if (
      typeof lat === "number" &&
      typeof lng === "number" &&
      isFinite(lat) &&
      isFinite(lng)
    ) {
      return { lat, lng };
    }
  }

  // Case 3: If it's a Google Maps LatLng object (has methods), extract values
  // This might occur if you are passing the raw Google Maps object around.
  if (
    typeof location.lat === "function" &&
    typeof location.lng === "function"
  ) {
    const lat = location.lat();
    const lng = location.lng();
    if (
      typeof lat === "number" &&
      typeof lng === "number" &&
      isFinite(lat) &&
      isFinite(lng)
    ) {
      return { lat, lng };
    }
  }

  // If none of the above, log a warning and return null to prevent errors
  console.warn("Invalid or unhandled location format detected:", location);
  return null;
};

/**
 * Helper function to process Google Maps Directions API steps and extract
 * meaningful start/end addresses and coordinates, and calculate cost.
 * @param {object} data - The response data from Google Directions API for a segment.
 * @param {boolean} isLastSegment - True if this is the final segment of the overall journey.
 * @param {string} overallJourneyDestination - The final destination of the user's entire journey (used for the very last step).
 * @param {object} balancedRide - The balanced ride object (needed for carpool cost).
 * @param {Date} journeyPreferredDateTime - The user's preferred date and time for rate calculation (cost based).
 * @returns {Array} An array of processed step objects.
 */
const processSteps = (
  data,
  isLastSegment = false,
  overallJourneyDestination = null,
  balancedRide = null,
  journeyPreferredDateTime // ADDED: Pass this parameter for cost calculation
) => {
  if (data.status !== "OK" || data.routes.length === 0) {
    // console.warn("Google Maps Directions API returned no results for a segment:", data.status);
    return [];
  }

  const segmentLeg = data.routes[0].legs[0];
  const processedSteps = [];

  // We'll track the last known precise end address to use as the next step's start address.
  // Initialize with the segment's start address and standardized location for the first step.
  let currentGeoAddress = segmentLeg.start_address;
  let currentGeoLocation = getLatLngFromLocation(segmentLeg.start_location);

  for (let index = 0; index < segmentLeg.steps.length; index++) {
    const step = segmentLeg.steps[index];
    // getStepTypeAndIconHint now also returns calculatorType
    const { type, iconHint, calculatorType } = getStepTypeAndIconHint(
      step,
      step.travel_mode // Use step.travel_mode for sub-steps
    );

    // Skip very short walking steps unless it's the only step in the leg
    if (
      step.travel_mode === "WALKING" &&
      step.distance.value < 150 &&
      segmentLeg.steps.length > 1 // Only skip if there are other steps in the leg
    ) {
      continue;
    }

    let description = "";
    let stepStartAddress = currentGeoAddress; // Default to previous step's end address
    let stepEndAddress = null;
    let stepStartLocation = currentGeoLocation; // Default to previous step's end location
    let stepEndLocation = null;

    if (step.travel_mode === "TRANSIT" && step.transit_details) {
      const lineName =
        step.transit_details.line.name || step.transit_details.line.short_name;
      const headsign = step.transit_details.headsign;

      // Description for Transit steps
      if (lineName && headsign) {
        description = `Ride the ${lineName} towards ${headsign}`;
      } else if (lineName) {
        description = `Ride the ${lineName}`;
      } else {
        description = step.html_instructions
          ? step.html_instructions.replace(/<\/?b>/g, "")
          : "Take Transit";
      }

      // Addresses for Transit steps are usually specific stop names
      stepStartAddress = step.transit_details.departure_stop?.name;
      stepEndAddress = step.transit_details.arrival_stop?.name;

      // Locations for Transit steps are also specific stop coordinates, ensure they are standardized
      stepStartLocation = getLatLngFromLocation(
        step.transit_details.departure_stop?.location
      );
      stepEndLocation = getLatLngFromLocation(
        step.transit_details.arrival_stop?.location
      );
    } else if (step.travel_mode === "WALKING") {
      const nextStep = segmentLeg.steps[index + 1];

      // Determine Description for Walking steps
      if (
        nextStep &&
        nextStep.travel_mode === "TRANSIT" &&
        nextStep.transit_details?.departure_stop?.name
      ) {
        description = `Walk to ${nextStep.transit_details.departure_stop.name}`;
      } else if (
        index === segmentLeg.steps.length - 1 &&
        isLastSegment &&
        overallJourneyDestination
      ) {
        // This is the very last walking step leading to the overall destination
        description = `Walk to ${overallJourneyDestination}`;
      } else if (step.html_instructions) {
        description = step.html_instructions.replace(/<\/?b>/g, "");
      } else {
        description = "Walk"; // Generic fallback description
      }

      // Determine Addresses for Walking steps
      // start_address: Use the previous step's end address or segment start
      if (index === 0) {
        stepStartAddress = segmentLeg.start_address; // First step of the segment
        stepStartLocation = getLatLngFromLocation(segmentLeg.start_location);
      } else {
        // Inherit from the end of the previous step in the sequence
        stepStartAddress =
          processedSteps[processedSteps.length - 1]?.end_address ||
          segmentLeg.start_address;
        stepStartLocation =
          processedSteps[processedSteps.length - 1]?.end_location ||
          getLatLngFromLocation(segmentLeg.start_location); // Fallback to segment start
      }

      // end_address:
      if (
        nextStep &&
        nextStep.travel_mode === "TRANSIT" &&
        nextStep.transit_details?.departure_stop?.name
      ) {
        stepEndAddress = nextStep.transit_details.departure_stop.name;
        stepEndLocation = getLatLngFromLocation(
          nextStep.transit_details.departure_stop.location
        );
      } else if (index === segmentLeg.steps.length - 1) {
        // If this is the last step within this particular segmentLeg
        stepEndAddress = segmentLeg.end_address;
        stepEndLocation = getLatLngFromLocation(segmentLeg.end_location);
      } else {
        // Try to extract from html_instructions, or default
        const matches = step.html_instructions?.match(/to\s(.+)/i);
        stepEndAddress = matches
          ? matches[1].replace(/<\/?b>/g, "").trim()
          : step.end_address || "Unknown Location";
        stepEndLocation = getLatLngFromLocation(step.end_location); // Use original Google LatLng if available, else null
      }
    } else {
      // For DRIVING or other modes (less common for sub-steps of a transit leg)
      description = step.html_instructions
        ? step.html_instructions.replace(/<\/?b>/g, "")
        : "Travel";

      // For these general steps, use segment leg's start/end if specific step addresses aren't there
      stepStartAddress = segmentLeg.start_address;
      stepEndAddress = segmentLeg.end_address;
      stepStartLocation = getLatLngFromLocation(segmentLeg.start_location);
      stepEndLocation = getLatLngFromLocation(segmentLeg.end_location);
    }

    // Final override with explicit string addresses from Google's API if they exist on the step
    if (step.start_address && typeof step.start_address === "string") {
      stepStartAddress = step.start_address;
    }
    if (step.end_address && typeof step.end_address === "string") {
      stepEndAddress = step.end_address;
    }

    // Always prioritize the direct LatLng objects from Google's step response if available
    // and standardize them.
    if (step.start_location) {
      const normalizedStartLoc = getLatLngFromLocation(step.start_location);
      if (normalizedStartLoc) {
        stepStartLocation = normalizedStartLoc;
      }
    }
    if (step.end_location) {
      const normalizedEndLoc = getLatLngFromLocation(step.end_location);
      if (normalizedEndLoc) {
        stepEndLocation = normalizedEndLoc;
      }
    }

    // Ensure addresses are always strings, even if empty or placeholder
    stepStartAddress = stepStartAddress || "";
    stepEndAddress = stepEndAddress || "";

    const stepDistanceKm = parseDistanceToKm(step.distance.text);

    processedSteps.push({
      type,
      description,
      duration: step.duration.text,
      cost: "$0.00", // Will be updated for transit/walking steps below
      icon: iconHint,
      distance: { text: step.distance.text, value: step.distance.value },
      stepDistanceKm: stepDistanceKm, // Store numeric distance for calculation
      eta: "N/A", // This ETA is overwritten later in the main loop for cumulative ETA
      start_address: stepStartAddress,
      end_address: stepEndAddress,
      start_location: stepStartLocation, // Standardized coordinates
      end_location: stepEndLocation, // Standardized coordinates
      calculatorType, // Store calculator type for later use
    });

    // Update currentGeoAddress and currentGeoLocation for the next iteration
    currentGeoAddress = stepEndAddress;
    currentGeoLocation = stepEndLocation;
  }

  // --- Calculate and assign costs for "bus/train" and "walking" steps ---
  let totalTransitAndWalkDistance = 0;
  const transitAndWalkStepsToUpdate = [];

  // First pass to identify all transit and related walking steps for cost calculation
  for (let i = 0; i < processedSteps.length; i++) {
    // Only aggregate costs for "bus/train" calculator type steps
    // "walking" steps that are part of a broader transit journey are grouped here.
    if (processedSteps[i].calculatorType === "bus/train") {
      totalTransitAndWalkDistance += processedSteps[i].stepDistanceKm;
      transitAndWalkStepsToUpdate.push(i);
    } else if (processedSteps[i].calculatorType === "walking") {
      // If "walking" is a standalone primary mode, it's free
      processedSteps[i].cost = "$0.00";
    }
  }

  if (transitAndWalkStepsToUpdate.length > 0) {
    // Calculate total transit cost once for the entire segment of transit/walk steps
    const transitSegmentCost = calculateTransportCost(
      "bus/train",
      totalTransitAndWalkDistance,
      { time: journeyPreferredDateTime.getHours() }
    );

    // Distribute the cost across all relevant transit/walking steps.
    // A simple proportional distribution is used here.
    // If totalTransitAndWalkDistance is 0 (e.g., very short transit), avoid division by zero.
    if (totalTransitAndWalkDistance > 0) {
      for (const indexToUpdate of transitAndWalkStepsToUpdate) {
        const step = processedSteps[indexToUpdate];
        const proportionalCost =
          (step.stepDistanceKm / totalTransitAndWalkDistance) *
          transitSegmentCost;
        step.cost = `$${proportionalCost.toFixed(2)}`;
      }
    } else {
      // If total distance is 0 but there are transit steps, assign full cost to the first transit step
      // or distribute minimally if cost is non-zero
      if (transitSegmentCost > 0 && transitAndWalkStepsToUpdate.length > 0) {
        processedSteps[
          transitAndWalkStepsToUpdate[0]
        ].cost = `$${transitSegmentCost.toFixed(2)}`;
        // Set others to $0.00 if this is a single fare for all related steps
        for (let i = 1; i < transitAndWalkStepsToUpdate.length; i++) {
          processedSteps[transitAndWalkStepsToUpdate[i]].cost = "$0.00";
        }
      }
    }
  }

  return processedSteps;
};

/**
 * GET /api/recommendations/:userJourneyId
 * Returns saved recommendations + balanced recommendation dynamically
 */
const getRecommendationsForUserJourney = async (req, res) => {
  const { userJourneyId } = req.params;
  const { default: fetch } = await import("node-fetch");

  try {
    const userJourney = await UserJourney.findById(userJourneyId);
    if (!userJourney) {
      return res.status(404).json({ message: "User Journey not found" });
    }

    // Ensure preferredDateTime is a Date object for consistent use
    const preferredDateTime =
      userJourney.preferredDateTime instanceof Date
        ? userJourney.preferredDateTime
        : new Date(userJourney.preferredDateTime);

    // --- Fastest recommendation - single carpool step only ---
    let fastestRecommendation = null;
    if (userJourney.journeyOrigin && userJourney.journeyDestination) {
      const origin = userJourney.journeyOrigin;
      const destination = userJourney.journeyDestination;

      const drivingApiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
        origin
      )}&destination=${encodeURIComponent(
        destination
      )}&mode=driving&key=${Maps_API_KEY}`;

      const drivingResponse = await fetch(drivingApiUrl);
      const drivingData = await drivingResponse.json();

      if (drivingData.status === "OK" && drivingData.routes.length > 0) {
        const leg = drivingData.routes[0].legs[0];
        const totalDurationMins = parseDurationToMinutes(leg.duration.text);
        const totalDistanceKm = parseDistanceToKm(leg.distance.text); // Get distance in KM

        // Calculate cost for the fastest carpool recommendation
        const passengerCountFastest = userJourney.passengersCount;
        const fastestCarpoolCost = calculateTransportCost(
          "taxi",
          totalDistanceKm,
          { time: preferredDateTime.getHours(), isAirport: false }
        );

        const splitFastestCost = fastestCarpoolCost / passengerCountFastest;

        const carpoolStep = {
          type: "carpool",
          description: `Carpool with RideBud`,
          duration: leg.duration.text,
          cost: `$${splitFastestCost.toFixed(2)}`,
          icon: "Car",
          distance: { text: leg.distance.text, value: leg.distance.value },
          start_address: origin,
          end_address: destination,
          // Ensure start/end locations from Google Maps API are standardized
          start_location: getLatLngFromLocation(leg.start_location),
          end_location: getLatLngFromLocation(leg.end_location),
        };

        fastestRecommendation = {
          userJourneyId: userJourney._id,
          type: "fastest-carpool",
          name: "Fastest (Carpool)",
          departureTime: preferredDateTime,
          totalTime: leg.duration.text,
          totalCostPerPax: `$${splitFastestCost.toFixed(2)}`, // renamed from costPerPax
          passengersCount: passengerCountFastest,
          carpoolRideCost: `$${fastestCarpoolCost.toFixed(2)}`, // ADDED: Total carpool cost
          carpoolStartTime: preferredDateTime, // Still based on user's preferredDateTime
          eta: calculateETA(preferredDateTime, totalDurationMins),
          totalDistance: leg.distance.text,
          steps: [carpoolStep],
        };
      } else {
        // Log the actual status for debugging API key issues
        console.warn("Fastest (Carpool) route not found:", drivingData.status);
      }
    }

    // --- Balanced recommendation (transit + 1 carpool step only) ---
    let balancedRecommendation = null;
    const balancedRide = await findBalancedRide(userJourney);

    if (balancedRide) {
      const origin = userJourney.journeyOrigin;
      const destination = userJourney.journeyDestination; // This is the overall final destination

      // NEW LOGIC START: Anchor timing to balancedRide.carpoolStartTime
      let actualCarpoolStartTimeDate;
      try {
        // --- FIX for TypeError: balancedRide.carpoolStartTime.split is not a function ---
        // balancedRide.carpoolStartTime is an ISO string from MongoDB
        if (typeof balancedRide.carpoolStartTime === "string") {
          actualCarpoolStartTimeDate = new Date(balancedRide.carpoolStartTime);
        } else if (balancedRide.carpoolStartTime instanceof Date) {
          actualCarpoolStartTimeDate = balancedRide.carpoolStartTime; // Already a Date
        } else {
          // Fallback for unexpected types
          throw new Error(
            `Unsupported type for balancedRide.carpoolStartTime: ${typeof balancedRide.carpoolStartTime}`
          );
        }

        if (isNaN(actualCarpoolStartTimeDate.getTime())) {
          throw new Error(
            "Parsed balancedRide.carpoolStartTime resulted in an invalid Date."
          );
        }
      } catch (e) {
        console.error("Error parsing balancedRide.carpoolStartTime:", e);
        // Fallback to preferredDateTime if carpoolStartTime is invalid or parsing fails
        actualCarpoolStartTimeDate = preferredDateTime;
      }

      // First, get duration for origin to pickup using Google Directions Transit.
      // We pass `preferredDateTime` as `departure_time` for this API call's departure time to get a 'realistic' route/duration
      // based on user preference, even though the final actual journey start will be calculated based on carpool time.
      const departureTimeForTransitToPickup = Math.floor(
        preferredDateTime.getTime() / 1000
      );

      const originToPickupUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
        origin
      )}&destination=${encodeURIComponent(
        balancedRide.carpoolPickupLocation
      )}&mode=transit&key=${Maps_API_KEY}&departure_time=${departureTimeForTransitToPickup}`;

      // Fetch data for origin to pickup
      const originToPickupRes = await fetch(originToPickupUrl);
      const originToPickupData = await originToPickupRes.json();

      let durationOriginToPickupMinutes = 0;
      if (
        originToPickupData.status === "OK" &&
        originToPickupData.routes.length > 0
      ) {
        durationOriginToPickupMinutes = parseDurationToMinutes(
          originToPickupData.routes[0].legs[0].duration.text
        );
      } else {
        // Log the actual status for debugging API key issues
        console.warn(
          "Origin to Carpool Pickup transit route not found or failed:",
          originToPickupData.status
        );
      }

      // Calculate the actual start time of the entire balanced journey
      // This is carpoolStartTime - time taken to get to pickup point
      const actualBalancedJourneyStartDate = new Date(
        actualCarpoolStartTimeDate.getTime() -
          durationOriginToPickupMinutes * 60 * 1000
      );

      // Now, for the dropoff to destination segment, calculate its departure time
      // This is the carpool start time + carpool duration
      const durationCarpoolMinutes = parseDurationToMinutes(
        balancedRide.carpoolDurationText
      );
      const carpoolDropoffTimeDate = new Date(
        actualCarpoolStartTimeDate.getTime() +
          durationCarpoolMinutes * 60 * 1000
      );
      const departureTimeForTransitFromDropoff = Math.floor(
        carpoolDropoffTimeDate.getTime() / 1000
      );

      const dropoffToDestinationUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
        balancedRide.carpoolDropoffLocation
      )}&destination=${encodeURIComponent(
        destination
      )}&mode=transit&key=${Maps_API_KEY}&departure_time=${departureTimeForTransitFromDropoff}`; // Use calculated carpool dropoff time as departure for next leg

      // Fetch data for dropoff to destination
      const dropoffToDestinationRes = await fetch(dropoffToDestinationUrl);
      const dropoffToDestinationData = await dropoffToDestinationRes.json();

      const stepsToPickup = processSteps(
        originToPickupData,
        false,
        null,
        balancedRide,
        preferredDateTime // Still pass preferredDateTime for cost calculation as it's a fixed user preference
      );

      const passengerCountBalanced =
        balancedRide.passengersCount + userJourney.passengersCount;

      const splitBalancedCost = balancedRide.estimatedPrice
        ? balancedRide.estimatedPrice / passengerCountBalanced
        : 0;

      const carpoolDistanceKm = parseDistanceToKm(
        balancedRide.carpoolDistanceText
      );

      const carpoolDistanceMeters = carpoolDistanceKm * 1000; // Convert to meters

      // Create carpool step (This is the "middle" segment)
      const carpoolStep = {
        type: "carpool",
        description: `Carpool with RideBud`,
        duration: balancedRide.carpoolDurationText,
        cost: `$${splitBalancedCost.toFixed(2)}`,
        icon: "Car",
        distance: {
          text: balancedRide.carpoolDistanceText,
          value: carpoolDistanceMeters,
        },
        eta: "N/A", // Will be set cumulatively below
        start_address: balancedRide.carpoolPickupLocation || "",
        end_address: balancedRide.carpoolDropoffLocation || "",
        matchedRideId: balancedRide._id,
        start_location: getLatLngFromLocation(balancedRide.carpoolPickupCoords),
        end_location: getLatLngFromLocation(balancedRide.carpoolDropoffCoords),
      };

      const stepsFromDropoff = processSteps(
        dropoffToDestinationData,
        true,
        destination,
        balancedRide,
        preferredDateTime // Still pass preferredDateTime for cost calculation
      );

      const balancedSteps = [
        ...stepsToPickup,
        carpoolStep,
        ...stepsFromDropoff,
      ];

      let totalDurationMinutes = 0;
      let totalCostNumeric = 0; // Track total cost numerically
      let cumulativeDurationFromJourneyStart = 0; // Cumulative duration from the *actual start of the balanced journey*

      // Calculate cumulative ETA and total cost for all balancedSteps
      for (const step of balancedSteps) {
        const stepDurationMins = parseDurationToMinutes(step.duration);
        cumulativeDurationFromJourneyStart += stepDurationMins; // Accumulate duration

        // Set ETA for each step based on the actual start time of the journey
        step.eta =
          calculateETA(
            actualBalancedJourneyStartDate,
            cumulativeDurationFromJourneyStart
          ) || "N/A";

        // Parse cost from string to number for summation
        const stepCostNumeric = parseFloat(step.cost.replace("$", "")) || 0;
        totalCostNumeric += stepCostNumeric;

        totalDurationMinutes += stepDurationMins; // This remains for overall total duration calculation
      }
      // NEW LOGIC END

      const totalTimeFormatted =
        totalDurationMinutes < 60
          ? `${totalDurationMinutes} min`
          : `${Math.floor(totalDurationMinutes / 60)} h ${
              totalDurationMinutes % 60
            } min`;

      const totalDistanceMeters = balancedSteps.reduce(
        (sum, step) => sum + (step.distance?.value || 0),
        0
      );

      const totalDistanceFormatted =
        totalDistanceMeters >= 1000
          ? `${(totalDistanceMeters / 1000).toFixed(1)} km`
          : `${totalDistanceMeters} m`;

      // Check if essential segments were found
      if (balancedSteps.length > 0) {
        balancedRecommendation = {
          userJourneyId: userJourney._id,
          type: "balanced-carpool",
          name: "Balanced (Carpool + Transit)",
          departureTime: actualBalancedJourneyStartDate,
          totalTime: totalTimeFormatted,
          passengersCount: passengerCountBalanced,
          totalCostPerPax: `$${totalCostNumeric.toFixed(2)}`, // Use calculated total cost
          carpoolRideCost: `$${balancedRide.estimatedPrice.toFixed(2)}`, // Use calculated cost per passenger
          carpoolStartTime: actualBalancedJourneyStartDate, // Set to the newly calculated actual journey start time
          eta: calculateETA(
            actualBalancedJourneyStartDate, // Use the actual journey start time
            totalDurationMinutes
          ),
          totalDistance: totalDistanceFormatted,
          steps: balancedSteps,
        };
      } else {
        console.warn(
          "Balanced (Carpool + Transit) route could not be fully constructed."
        );
      }
    }

    return res.status(200).json({
      fastestRecommendation,
      balancedRecommendation,
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ message: "Invalid User Journey ID format." });
    }
    return res
      .status(500)
      .json({ message: "Server error fetching recommendations." });
  }
};

module.exports = {
  getRecommendationsForUserJourney,
};
