// controllers/carpoolRideController.js
const { default: fetch } = require("node-fetch"); // Ensure node-fetch is installed
const CarpoolRide = require("../models/CarpoolRide");
const User = require("../models/User");
const UserJourney = require("../models/UserJourney");

const Maps_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!Maps_API_KEY) {
  console.error(
    "SERVER ERROR: Maps_API_KEY is not set in environment variables for the backend."
  );
}

// Helper: dynamically import node-fetch and geocode an address
// Note: Changed to use the 'fetch' imported above, no need for dynamic import inside helper
// Helper to get concise place name from input address using Places Autocomplete + Place Details
const getPlaceName = async (input) => {
  if (!Maps_API_KEY) {
    throw new Error("Google Maps API key missing");
  }

  // 1. Places Autocomplete API call
  const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input
  )}&key=${Maps_API_KEY}&types=establishment|geocode`;

  const autocompleteRes = await fetch(autocompleteUrl);
  const autocompleteData = await autocompleteRes.json();

  if (
    autocompleteData.status !== "OK" ||
    !autocompleteData.predictions.length
  ) {
    throw new Error(`Place autocomplete failed for input: ${input}`);
  }

  const placeId = autocompleteData.predictions[0].place_id;

  // 2. Place Details API call to get name
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name&key=${Maps_API_KEY}`;

  const detailsRes = await fetch(detailsUrl);
  const detailsData = await detailsRes.json();

  if (detailsData.status !== "OK" || !detailsData.result.name) {
    throw new Error(`Place details fetch failed for place_id: ${placeId}`);
  }

  return detailsData.result.name;
};

// Your existing geocode helper, unchanged
const geocodeAddress = async (address) => {
  if (!Maps_API_KEY) {
    throw new Error("Google Maps API key is missing in environment.");
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${Maps_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !data.results.length) {
    throw new Error(`Failed to geocode address: ${address}`);
  }

  const location = data.results[0].geometry.location;
  return {
    type: "Point",
    coordinates: [location.lng, location.lat], // GeoJSON format for MongoDB: [lng, lat]
  };
};

const createCarpoolRide = async (req, res) => {
  const authenticatedUserId = req.user.userId;

  const {
    carpoolPickupLocation,
    carpoolDropoffLocation,
    carpoolStartTime,
    carpoolDate,
    status,
    estimatedPrice,
    userJourneyId,
    passengersCount,
  } = req.body;

  if (
    !carpoolPickupLocation ||
    !carpoolDropoffLocation ||
    !carpoolStartTime ||
    !carpoolDate ||
    !estimatedPrice
  ) {
    return res
      .status(400)
      .json({ message: "Missing required fields for carpool ride creation." });
  }

  try {
    // Get short place names using Places API
    const shortPickupName = await getPlaceName(carpoolPickupLocation);
    const shortDropoffName = await getPlaceName(carpoolDropoffLocation);

    // Geocode the original full input addresses to coordinates
    const pickupCoords = await geocodeAddress(carpoolPickupLocation);
    const dropoffCoords = await geocodeAddress(carpoolDropoffLocation);

    // Fetch directions for duration/distance text
    let carpoolDurationText = "N/A";
    let carpoolDistanceText = "N/A";

    if (Maps_API_KEY) {
      try {
        const drivingApiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
          carpoolPickupLocation
        )}&destination=${encodeURIComponent(
          carpoolDropoffLocation
        )}&mode=driving&key=${Maps_API_KEY}`;

        const drivingResponse = await fetch(drivingApiUrl);
        const drivingData = await drivingResponse.json();

        if (drivingData.status === "OK" && drivingData.routes.length > 0) {
          const leg = drivingData.routes[0].legs[0];
          carpoolDurationText = leg.duration.text;
          carpoolDistanceText = leg.distance.text;
        }
      } catch (error) {
        console.error(
          "Error fetching carpool route details during creation:",
          error
        );
      }
    }

    const newCarpoolRide = new CarpoolRide({
      carpoolMainUserId: authenticatedUserId,
      carpoolPickupLocation: shortPickupName,
      carpoolDropoffLocation: shortDropoffName,
      carpoolPickupCoords: pickupCoords,
      carpoolDropoffCoords: dropoffCoords,
      carpoolStartTime,
      carpoolDate: new Date(carpoolDate),
      riderIds: [authenticatedUserId],
      status: status,
      estimatedPrice,
      carpoolDurationText,
      carpoolDistanceText,
      passengersCount,
    });

    const savedRide = await newCarpoolRide.save();

    if (userJourneyId) {
      try {
        await UserJourney.findOneAndUpdate(
          { _id: userJourneyId, userId: authenticatedUserId },
          { $set: { status: "no-match", matchedRideId: savedRide._id } },
          { new: true }
        );
        console.log(
          `UserJourney ${userJourneyId} status updated to 'no-match' and matchedRideId set.`
        );
      } catch (journeyUpdateError) {
        console.error(
          `Error updating driver's UserJourney status for ${userJourneyId}:`,
          journeyUpdateError
        );
      }
    }

    res.status(201).json({
      message: "Carpool ride created successfully!",
      carpoolRide: savedRide,
    });
  } catch (error) {
    console.error("Error creating carpool ride:", error.message);
    res.status(500).json({
      message: "Server error creating carpool ride.",
      error: error.message,
    });
  }
};

/**
 * Helper function to enrich a single CarpoolRide with rideBuddy info.
 * This is now a standalone helper.
 */
const enrichCarpoolRideWithBuddyInfo = async (carpoolRide) => {
  let rideBuddy = null;

  if (carpoolRide.riderIds && carpoolRide.riderIds.length > 0) {
    const firstRiderId = carpoolRide.riderIds[0];
    const firstRider = await User.findById(firstRiderId).select(
      "displayName avatar rating"
    );
    if (firstRider) {
      rideBuddy = {
        id: firstRider._id.toString(),
        name: firstRider.displayName,
        avatar:
          firstRider.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstRider.displayName}`,
        rating: firstRider.rating || 0,
        phone: "+1 (555) 111-2222",
      };
    }
  }

  return {
    ...(carpoolRide.toObject ? carpoolRide.toObject() : carpoolRide),
    rideBuddy,
  };
};

/**
 * Fetches details for a specific carpool ride by its ID.
 * This function now queries the database for the CarpoolRide and its associated UserJourney.
 */
const getCarpoolRideDetailsByRideId = async (req, res) => {
  const { rideId } = req.params;

  try {
    // Find the CarpoolRide by its ID
    const carpoolRide = await CarpoolRide.findById(rideId);

    if (!carpoolRide) {
      return res.status(404).json({ message: "Carpool Ride not found." });
    }

    // NEW: Enrich the carpool ride with rideBuddy info
    const enrichedCarpoolRide = await enrichCarpoolRideWithBuddyInfo(
      carpoolRide
    );

    // primaryJourneyId was removed from CarpoolRide model.
    // If you still need journeyOrigin/Destination for this specific endpoint,
    // you would need to fetch the UserJourney that *references* this CarpoolRide
    // via its 'matchedRideId' field. This is more complex and usually handled
    // by the UserJourney controller or frontend logic.
    // For now, we'll assume the frontend's 'MarketplaceRideList' will get overall journey context from UserJourney.

    // Combine carpool ride details with relevant user journey details for the frontend
    res.status(200).json({
      rideDetails: {
        id: enrichedCarpoolRide._id, // Use _id from Mongoose document
        journeyOrigin: null, // Set to null as it's not directly on CarpoolRide
        journeyDestination: null, // Set to null as it's not directly on CarpoolRide

        // Carpool specific details (from the CarpoolRide)
        carpoolPickupLocation: enrichedCarpoolRide.carpoolPickupLocation,
        carpoolDropoffLocation: enrichedCarpoolRide.carpoolDropoffLocation,
        carpoolStartTime: enrichedCarpoolRide.carpoolStartTime,
        carpoolDate: enrichedCarpoolRide.carpoolDate,
        riderIds: enrichedCarpoolRide.riderIds,
        status: enrichedCarpoolRide.status,
        estimatedPrice: enrichedCarpoolRide.estimatedPrice,
        // --- INCLUDE NEW FIELDS HERE ---
        carpoolDurationText: enrichedCarpoolRide.carpoolDurationText,
        carpoolDistanceText: enrichedCarpoolRide.carpoolDistanceText,
        // --- END NEW FIELDS ---
        rideBuddy: enrichedCarpoolRide.rideBuddy, // NEW: Include rideBuddy
        createdAt: enrichedCarpoolRide.createdAt, // Include timestamps if useful for frontend
        updatedAt: enrichedCarpoolRide.updatedAt,
        passengersCount: enrichedCarpoolRide.passengersCount,
      },
    });
  } catch (error) {
    console.error("Error fetching carpool ride details by ID:", error);
    // Handle invalid ID format specifically for Mongoose CastError
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ message: "Invalid Carpool Ride ID format." });
    }
    res.status(500).json({ message: "Server error." });
  }
};

/**
 * Fetches carpool rides by a specific user ID.
 * This will find rides where the given userId is present in the riderIds array.
 */
const getCarpoolRidesByUserId = async (req, res) => {
  const { userId } = req.params; // Get userId from URL parameters

  try {
    // Find carpool rides where the riderIds array contains the given userId
    const userCarpoolRides = await CarpoolRide.find({ riderIds: userId });

    if (userCarpoolRides.length === 0) {
      return res
        .status(404)
        .json({ message: "No carpool rides found for this user." });
    }

    // NEW: Enrich each carpool ride with rideBuddy info
    const enrichedRides = await Promise.all(
      userCarpoolRides.map((ride) => enrichCarpoolRideWithBuddyInfo(ride))
    );

    res.status(200).json({ carpoolRides: enrichedRides });
  } catch (error) {
    console.error("Error fetching carpool rides by user ID:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid User ID format." });
    }
    res
      .status(500)
      .json({ message: "Server error fetching carpool rides for user." });
  }
};

// For example, a simple endpoint to get all carpool rides (for MarketplaceRideList)
const getAllCarpoolRides = async (req, res) => {
  try {
    const carpoolRides = await CarpoolRide.find({}); // Fetch all carpool rides
    // In a real app, you might want to paginate, filter, or sort these.

    // NEW: Enrich each carpool ride with rideBuddy info
    const enrichedRides = await Promise.all(
      carpoolRides.map((ride) => enrichCarpoolRideWithBuddyInfo(ride))
    );

    // primaryJourneyId was removed from CarpoolRide model.
    // The previous logic to populate journeyOrigin/Destination from primaryJourneyId
    // is no longer applicable here. The frontend's MarketplaceRideList should display
    // carpool-specific origin/destination.

    res.status(200).json({ carpoolRides: enrichedRides });
  } catch (error) {
    console.error("Error fetching all carpool rides:", error);
    res.status(500).json({ message: "Server error fetching carpool rides." });
  }
};

// PATCH /api/carpool-rides/:rideId/join
const joinCarpoolRide = async (req, res) => {
  const { rideId } = req.params;
  const userId = req.user.userId;

  try {
    const ride = await CarpoolRide.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Carpool ride not found." });
    }

    // Check if user is already in the ride
    if (ride.riderIds.includes(userId)) {
      return res
        .status(400)
        .json({ message: "User already joined this ride." });
    }

    ride.riderIds.push(userId);
    await ride.save();

    return res
      .status(200)
      .json({ message: "Successfully joined carpool ride.", ride });
  } catch (error) {
    console.error("Error joining carpool ride:", error);
    return res
      .status(500)
      .json({ message: "Server error joining carpool ride." });
  }
};

module.exports = {
  createCarpoolRide,
  getCarpoolRideDetailsByRideId,
  getCarpoolRidesByUserId,
  getAllCarpoolRides,
  joinCarpoolRide,
  enrichCarpoolRideWithBuddyInfo,
};
