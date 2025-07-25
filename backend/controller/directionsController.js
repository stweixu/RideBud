// Change 'require' to dynamic 'import' for node-fetch
// This is necessary because node-fetch v3+ is an ES Module (ESM)
// and cannot be directly 'require()'d in a CommonJS context.
// We will import it inside the functions that use it.

// IMPORTANT: Ensure your Google Maps API Key is in your .env file
// and loaded via dotenv in your main server file (e.g., server.js or app.js)

//controller/directionsController.js
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.error(
    "SERVER ERROR: GOOGLE_MAPS_API_KEY is not set in environment variables for the backend."
  );
}

/**
 * Handles requests to get detailed journey recommendations from Google Directions API.
 * Expected query parameters: origin, destination.
 * Returns an array of journey options (Fastest, Balanced).
 */
const getJourneyRecommendations = async (req, res) => {
  // Dynamically import node-fetch inside the async function
  const { default: fetch } = await import("node-fetch");

  if (!GOOGLE_MAPS_API_KEY) {
    return res.status(500).json({
      message: "Server configuration error: Google Maps API key missing.",
    });
  }

  const { origin, destination } = req.query;

  if (!origin || !destination) {
    return res.status(400).json({
      message:
        "Origin and destination are required for journey recommendations.",
    });
  }

  let journeyOptions = [];

  // Helper to calculate ETA
  const calculateETA = (durationText) => {
    const now = new Date();
    const durationMinutes = parseDurationToMinutes(durationText);
    now.setMinutes(now.getMinutes() + durationMinutes);
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Helper to parse duration string (e.g., "38 min", "1 h") into total minutes.
  const parseDurationToMinutes = (durationString) => {
    const parts = durationString.match(/(\d+)\s*(min|h)?/);
    if (!parts) return 0;
    const value = parseInt(parts[1]);
    const unit = parts[2];
    if (unit === "h") return value * 60;
    return value; // Default to minutes if no unit or 'min'
  };

  // Helper to determine step type and icon hint from Google step data
  const getStepTypeAndIconHint = (step, mode) => {
    if (mode === "DRIVING") {
      return { type: "carpool", iconHint: "Car" };
    }
    if (mode === "TRANSIT") {
      if (step.travel_mode === "WALKING") {
        return { type: "walking", iconHint: "FootprintsIcon" };
      }
      if (step.travel_mode === "TRANSIT" && step.transit_details) {
        const vehicleType =
          step.transit_details.line.vehicle.type.toLowerCase();
        if (vehicleType.includes("bus"))
          return { type: "bus", iconHint: "Bus" };
        if (
          vehicleType.includes("train") ||
          vehicleType.includes("subway") ||
          vehicleType.includes("rail")
        )
          return { type: "train", iconHint: "Train" };
      }
      return { type: "public_transport", iconHint: "Bus" }; // Generic public transport
    }
    if (mode === "WALKING") {
      return { type: "walking", iconHint: "FootprintsIcon" };
    }
    if (mode === "BICYCLING") {
      return { type: "bicycling", iconHint: "Bike" };
    }
    return { type: "unknown", iconHint: "Navigation" };
  };

  // --- 1. Fastest Route (Carpool Only) ---
  try {
    const drivingApiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(
      destination
    )}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
    const drivingResponse = await fetch(drivingApiUrl);
    const drivingData = await drivingResponse.json();

    if (drivingData.status === "OK" && drivingData.routes.length > 0) {
      const leg = drivingData.routes[0].legs[0];
      const drivingSteps = leg.steps.map((step) => {
        const { type, iconHint } = getStepTypeAndIconHint(step, "DRIVING");
        return {
          type: type,
          description: step.html_instructions.replace(/<\/?b>/g, ""),
          duration: step.duration.text,
          cost: "$X.XX", // Placeholder for carpool cost
          icon: iconHint, // Hint for frontend to pick Lucide icon
        };
      });

      journeyOptions.push({
        id: "fastest-carpool",
        name: "Fastest (Carpool)",
        totalTime: leg.duration.text,
        totalCost: "$16.00", // Example cost
        eta: calculateETA(leg.duration.text),
        totalDistance: leg.distance.text,
        steps: drivingSteps,
      });
    }
  } catch (error) {
    console.error("Error fetching fastest (driving) directions:", error);
  }

  // --- 2. Balanced Route (Conceptual Mixed Mode) ---
  // This is a conceptual mixed-mode journey. It does NOT dynamically search pendingRides.
  // It provides illustrative steps combining driving/carpool, public transport, and walking.
  try {
    // For a real implementation, you'd integrate database queries and more complex logic here.
    // For now, we'll simulate a balanced journey.
    const balancedJourneySteps = [
      {
        type: "walking",
        description: "Walk to nearest bus stop (e.g., Sengkang MRT)",
        duration: "5 min",
        cost: "$0.00",
        icon: "FootprintsIcon",
        distance: { text: "0.4 km", value: 400 }, // Example distance
      },
      {
        type: "bus",
        description: "Take bus 80 to Serangoon Interchange",
        duration: "15 min",
        cost: "$1.50",
        icon: "Bus",
        distance: { text: "5.2 km", value: 5200 },
      },
      {
        type: "carpool",
        description: "Carpool from Serangoon Interchange to NTU",
        duration: "25 min",
        cost: "$8.00",
        icon: "Car",
        distance: { text: "18.0 km", value: 18000 },
      },
      {
        type: "walking",
        description: "Walk from NTU drop-off to final destination",
        duration: "7 min",
        cost: "$0.00",
        icon: "FootprintsIcon",
        distance: { text: "0.6 km", value: 600 },
      },
    ];

    // Calculate total time and distance for the conceptual balanced journey
    const totalBalancedDurationMinutes = balancedJourneySteps.reduce(
      (sum, step) => sum + parseDurationToMinutes(step.duration),
      0
    );
    const totalBalancedDistanceValue = balancedJourneySteps.reduce(
      (sum, step) => sum + (step.distance?.value || 0),
      0
    );

    // Format total time and distance
    const totalBalancedTime =
      totalBalancedDurationMinutes < 60
        ? `${totalBalancedDurationMinutes} min`
        : `${Math.floor(totalBalancedDurationMinutes / 60)} h ${
            totalBalancedDurationMinutes % 60
          } min`;
    const totalBalancedDistance =
      totalBalancedDistanceValue >= 1000
        ? `${(totalBalancedDistanceValue / 1000).toFixed(1)} km`
        : `${totalBalancedDistanceValue} m`;

    journeyOptions.push({
      id: "balanced-mixed",
      name: "Balanced (Mixed Mode)",
      totalTime: totalBalancedTime,
      totalCost: "$9.50", // Example cost for balanced route
      eta: calculateETA(totalBalancedTime),
      totalDistance: totalBalancedDistance,
      steps: balancedJourneySteps,
    });
  } catch (error) {
    console.error("Error creating balanced (mixed mode) journey:", error);
  }

  // Sort journey options for consistent display (e.g., Fastest, Balanced)
  // Ensure 'fastest-carpool' comes before 'balanced-mixed'
  journeyOptions.sort((a, b) => {
    if (a.id === "fastest-carpool") return -1;
    if (b.id === "fastest-carpool") return 1;
    return 0;
  });

  res.status(200).json({ journeyRecommendations: journeyOptions });
};

/**
 * Handles requests to geocode LatLng coordinates to an address using Google Geocoding API.
 * Expected query parameters: lat, lng.
 */
const geocodeLatLngToAddress = async (req, res) => {
  // Dynamically import node-fetch inside the async function
  const { default: fetch } = await import("node-fetch");

  if (!GOOGLE_MAPS_API_KEY) {
    return res.status(500).json({
      message: "Server configuration error: Google Maps API key missing.",
    });
  }

  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res
      .status(400)
      .json({ message: "Latitude and longitude are required for geocoding." });
  }

  const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      // Return the most accurate formatted address (usually the first result)
      res.status(200).json({ address: data.results[0].formatted_address });
    } else {
      console.error(
        "Google Geocoding API responded with an error or no results:",
        data
      );
      res.status(data.status === "ZERO_RESULTS" ? 404 : 400).json({
        message:
          data.error_message || "Could not geocode coordinates to an address.",
        googleStatus: data.status,
      });
    }
  } catch (error) {
    console.error("Error geocoding LatLng to address:", error);
    res
      .status(500)
      .json({ message: "Failed to connect to Google Maps Geocoding service." });
  }
};

module.exports = { getJourneyRecommendations, geocodeLatLngToAddress };
