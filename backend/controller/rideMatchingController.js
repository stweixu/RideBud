// controllers/RideMatchingController.js

const CarpoolRide = require("../models/CarpoolRide");
const UserJourney = require("../models/UserJourney");
const { calculateTransportCost } = require("../utility/transportCalculator");

const MAX_DISTANCE_METERS = 1500;
const TIME_WINDOW_MINUTES = 60;

/**
 * Helper to calculate distance between [lng, lat] coords (Haversine formula)
 */
const getDistanceMeters = (coord1, coord2) => {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2; // Reverted to original, correct line

  const R = 6371000; // Earth's radius in meters
  const toRad = (v) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Helper to check if two coords are within MAX_DISTANCE_METERS
 */
const isNearby = (coord1, coord2) =>
  getDistanceMeters(coord1, coord2) <= MAX_DISTANCE_METERS;

/**
 * Helper to parse distance text (e.g., "1.5 km", "500 m") into kilometers.
 */
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

  return 0; // Return 0 if format is not recognized
};

/**
 * Find the best balanced carpool ride for a given userJourney.
 * Returns one CarpoolRide document or null if none found.
 */
const findBalancedRide = async (userJourney) => {
  if (
    !userJourney.journeyOriginCoords ||
    !userJourney.journeyDestinationCoords ||
    !userJourney.preferredDateTime
  ) {
    throw new Error(
      "UserJourney missing required geocoords or preferredDateTime"
    );
  }

  console.log(">>> findBalancedRide: START for userJourney:", userJourney._id);
  console.log("Origin coords:", userJourney.journeyOriginCoords);
  console.log("Destination coords:", userJourney.journeyDestinationCoords);
  console.log("Preferred time:", userJourney.preferredDateTime);

  const journeyTime = new Date(userJourney.preferredDateTime);

  // Define calendar day start (midnight UTC)
  const journeyDayStart = new Date(journeyTime);
  journeyDayStart.setUTCHours(0, 0, 0, 0);

  // Next day midnight UTC
  const journeyDayEnd = new Date(journeyDayStart);
  journeyDayEnd.setUTCDate(journeyDayEnd.getUTCDate() + 1);

  // Define time window for carpoolStartTime filtering (ISO strings)
  const startWindow = new Date(
    journeyTime.getTime() - TIME_WINDOW_MINUTES * 60000
  );
  const endWindow = new Date(
    journeyTime.getTime() + TIME_WINDOW_MINUTES * 60000
  );

  console.log(
    "Date window:",
    journeyDayStart.toISOString(),
    "to",
    journeyDayEnd.toISOString()
  );
  console.log(
    "Time window:",
    startWindow.toISOString(),
    "to",
    endWindow.toISOString()
  );

  let pickupNearbyRides = [];
  let dropoffNearbyRides = [];

  try {
    pickupNearbyRides = await CarpoolRide.find({
      carpoolDate: { $gte: journeyDayStart, $lt: journeyDayEnd },
      carpoolPickupCoords: {
        $near: {
          $geometry: userJourney.journeyOriginCoords,
          $maxDistance: MAX_DISTANCE_METERS,
        },
      },
      carpoolStartTime: {
        $gte: startWindow.toISOString(),
        $lte: endWindow.toISOString(),
      },
      status: "no-match",
    });
    console.log("Pickup nearby rides:", pickupNearbyRides.length);
  } catch (err) {
    console.error("Error in pickupNearbyRides query:", err);
  }

  try {
    dropoffNearbyRides = await CarpoolRide.find({
      carpoolDate: { $gte: journeyDayStart, $lt: journeyDayEnd },
      carpoolDropoffCoords: {
        $near: {
          $geometry: userJourney.journeyDestinationCoords,
          $maxDistance: MAX_DISTANCE_METERS,
        },
      },
      carpoolStartTime: {
        $gte: startWindow.toISOString(),
        $lte: endWindow.toISOString(),
      },
      status: "no-match",
    });
    console.log("Dropoff nearby rides:", dropoffNearbyRides.length);
  } catch (err) {
    console.error("Error in dropoffNearbyRides query:", err);
  }

  const combinedMap = new Map();
  pickupNearbyRides.forEach((ride) =>
    combinedMap.set(ride._id.toString(), ride)
  );
  dropoffNearbyRides.forEach((ride) =>
    combinedMap.set(ride._id.toString(), ride)
  );
  const combinedRides = Array.from(combinedMap.values());

  console.log("Combined unique rides:", combinedRides.length);

  if (combinedRides.length === 0) {
    console.log(">>> No rides matched by location or time window.");
    return null;
  }

  // Rank by secondary distance as before
  const ranked = combinedRides
    .map((ride) => {
      const pickupCoords = ride.carpoolPickupCoords?.coordinates;
      const dropoffCoords = ride.carpoolDropoffCoords?.coordinates;
      const originCoords = userJourney.journeyOriginCoords.coordinates;
      const destCoords = userJourney.journeyDestinationCoords.coordinates;

      const pickupClose = pickupCoords
        ? isNearby(pickupCoords, originCoords)
        : false;
      const dropoffClose = dropoffCoords
        ? isNearby(dropoffCoords, destCoords)
        : false;

      let secondaryDistance = Number.MAX_SAFE_INTEGER;

      if (pickupClose && dropoffCoords) {
        secondaryDistance = getDistanceMeters(dropoffCoords, destCoords);
      } else if (dropoffClose && pickupCoords) {
        secondaryDistance = getDistanceMeters(pickupCoords, originCoords);
      }

      return {
        ride,
        score: secondaryDistance,
      };
    })
    .sort((a, b) => a.score - b.score);

  console.log("Ranked rides:");
  ranked.forEach((entry, index) => {
    console.log(
      `   #${index + 1} Ride ${entry.ride._id}: score=${entry.score}`
    );
  });

  const bestRide = ranked.length > 0 ? ranked[0].ride : null;

  if (bestRide) {
    console.log(">>> Selected best ride:", bestRide._id);

    // Convert Mongoose document to plain object before adding new properties
    const bestRideObject = bestRide.toObject();

    // Calculate estimated price for the carpool ride
    const carpoolDistanceKm = parseDistanceToKm(
      bestRideObject.carpoolDistanceText
    );

    // Get the hour from the user's preferredDateTime for rate calculation
    // Ensure preferredDateTime is a Date object before getting hours
    const preferredDateTime =
      userJourney.preferredDateTime instanceof Date
        ? userJourney.preferredDateTime
        : new Date(userJourney.preferredDateTime);

    const journeyHour = preferredDateTime.getHours();

    // Assuming carpool rides are priced like taxis based on the provided rules
    // and no specific airport surcharge applies unless explicitly indicated in the ride itself
    const estimatedPrice = calculateTransportCost("taxi", carpoolDistanceKm, {
      time: journeyHour,
      isAirport: false, // Default to false, need further logic if airport rides are to be handled
    });

    bestRideObject.estimatedPrice = estimatedPrice;

    bestRideObject.passengersCount = bestRide.passengersCount;

    return bestRideObject;
  } else {
    return null;
  }
};

/**
 * Express controller to return best matched balanced ride for a userJourneyId param
 */
const findBalancedRidesController = async (req, res) => {
  const { userJourneyId } = req.params;

  try {
    const journey = await UserJourney.findById(userJourneyId);
    if (!journey) {
      return res.status(404).json({ message: "User Journey not found" });
    }

    const bestRide = await findBalancedRide(journey);

    if (!bestRide) {
      return res.status(404).json({ message: "No balanced rides found" });
    }

    res.status(200).json({ matchedRide: bestRide });
  } catch (err) {
    console.error("Error finding balanced ride:", err);
    res.status(500).json({ message: "Server error finding carpool match." });
  }
};

module.exports = {
  findBalancedRide,
  findBalancedRidesController,
};
