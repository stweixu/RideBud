const UserJourney = require("../models/UserJourney");
const CarpoolRide = require("../models/CarpoolRide");
const User = require("../models/User");
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const JourneyNavigation = require("../models/JourneyNavigation");

// --- Helper to auto-assign status ---
const updateJourneyStatusBasedOnRide = async (journey) => {
  if (["completed", "cancelled"].includes(journey.status)) {
    // Do not overwrite completed or cancelled journeys
    return;
  }

  if (!journey.matchedRideId) {
    journey.status = "pending-selection";
  } else {
    const carpoolRide = await CarpoolRide.findById(journey.matchedRideId);
    if (!carpoolRide || carpoolRide.riderIds.length <= 1) {
      journey.status = "no-match";
    } else {
      journey.status = "matched";
    }
  }
  await journey.save();
};

// --- Geocoding ---
const geocodeAddress = async (address) => {
  const { default: fetch } = await import("node-fetch");
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${GOOGLE_MAPS_API_KEY}`
  );
  const data = await response.json();
  if (data.status === "OK") {
    const location = data.results[0].geometry.location;
    return { type: "Point", coordinates: [location.lng, location.lat] };
  } else {
    throw new Error(`Geocoding failed: ${data.status}`);
  }
};

// --- Create journey ---
const createUserJourney = async (req, res) => {
  const userId = req.user.userId;
  const {
    journeyOrigin,
    journeyDestination,
    preferredDateTime,
    passengersCount,
  } = req.body;

  if (
    !journeyOrigin ||
    !journeyDestination ||
    !preferredDateTime ||
    !passengersCount
  ) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const originCoords = await geocodeAddress(journeyOrigin);
    const destinationCoords = await geocodeAddress(journeyDestination);

    const newUserJourney = new UserJourney({
      userId,
      journeyOrigin,
      journeyDestination,
      journeyOriginCoords: originCoords,
      journeyDestinationCoords: destinationCoords,
      preferredDateTime: new Date(preferredDateTime),
      passengersCount,
      status: "pending-selection",
    });

    await newUserJourney.save();

    res
      .status(201)
      .json({ message: "Journey created!", userJourney: newUserJourney });
  } catch (error) {
    console.error("Create journey error:", error);
    res.status(500).json({ message: "Server error creating journey." });
  }
};

// --- Enrich for frontend ---
const enrichUserJourneyWithRideInfo = async (journey) => {
  let carpoolRide = null;
  let rideBuddy = null;

  if (journey.matchedRideId) {
    const rideDoc = await CarpoolRide.findById(journey.matchedRideId).populate(
      "riderIds",
      "displayName avatar rating"
    );

    if (rideDoc) {
      const currentUser = journey.userId.toString();
      const otherRiders = rideDoc.riderIds.filter(
        (r) => r._id.toString() !== currentUser
      );
      if (otherRiders.length > 0) {
        rideBuddy = {
          id: otherRiders[0]._id.toString(),
          name: otherRiders[0].displayName,
          avatar:
            otherRiders[0].avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherRiders[0].displayName}`,
          rating: otherRiders[0].rating || 0,
          phone: "+1 (555) 123-4567",
        };
      }

      carpoolRide = {
        id: rideDoc._id.toString(),
        carpoolPickupLocation: rideDoc.carpoolPickupLocation,
        carpoolDropoffLocation: rideDoc.carpoolDropoffLocation,
        carpoolStartTime: rideDoc.carpoolStartTime,
        carpoolDate: rideDoc.carpoolDate,
        riderIds: rideDoc.riderIds.map((r) => r._id.toString()),
        estimatedPrice: rideDoc.estimatedPrice,
        passengersCount: rideDoc.passengersCount,
        rideBuddy,
      };
    }
  }

  return {
    id: journey._id.toString(),
    userId: journey.userId.toString(),
    journeyOrigin: journey.journeyOrigin,
    journeyDestination: journey.journeyDestination,
    preferredDateTime: journey.preferredDateTime,
    passengersCount: journey.passengersCount,
    status: journey.status,
    matchedRideId: journey.matchedRideId?.toString() || null,
    carpoolRide,
    totalCostPerPax: journey.journeyNavigation?.totalCostPerPax || 0,
    createdAt: journey.createdAt,
    updatedAt: journey.updatedAt,
  };
};

// --- Get by ID ---
const getUserJourneyById = async (req, res) => {
  try {
    const userJourney = await UserJourney.findById(req.params.userJourneyId);
    if (!userJourney)
      return res.status(404).json({ message: "Journey not found." });

    await updateJourneyStatusBasedOnRide(userJourney);
    const enriched = await enrichUserJourneyWithRideInfo(userJourney);
    res.status(200).json({ userJourney: enriched });
  } catch (err) {
    console.error("Get journey error:", err);
    res.status(500).json({ message: "Server error fetching journey." });
  }
};

// --- Get all journeys ---
const getUserJourneys = async (req, res) => {
  try {
    const journeys = await UserJourney.find({ userId: req.user.userId })
      .sort({
        preferredDateTime: 1,
      })
      .populate("journeyNavigation"); // populate journeyNavigation field

    await Promise.all(journeys.map(updateJourneyStatusBasedOnRide));
    const enriched = await Promise.all(
      journeys.map(async (journey) => {
        const base = await enrichUserJourneyWithRideInfo(journey);

        return {
          ...base,
          journeyNavigation: journey.journeyNavigation || null,
        };
      })
    );

    res.status(200).json({ userJourneys: enriched });
  } catch (err) {
    console.error("Get all journeys error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

const getUpcomingJourney = async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();

    // Find earliest upcoming matched journey
    const upcomingJourney = await UserJourney.findOne({
      userId,
      preferredDateTime: { $gt: now },
      status: "matched",
    })
      .sort({ preferredDateTime: 1 })
      .populate("journeyNavigation");

    if (!upcomingJourney) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No upcoming rides found.",
      });
    }

    // Update status just in case
    await updateJourneyStatusBasedOnRide(upcomingJourney);

    // Enrich with ride info and rideBuddy details
    const enrichedJourney = await enrichUserJourneyWithRideInfo(
      upcomingJourney
    );

    res.status(200).json({
      success: true,
      data: enrichedJourney,
    });
  } catch (error) {
    console.error("Error fetching upcoming journey:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --- Match a ride ---
const updateMatchedRideId = async (req, res) => {
  try {
    const journey = await UserJourney.findById(req.params.userJourneyId);
    if (!journey)
      return res.status(404).json({ message: "Journey not found." });

    const matchedRideId = req.body.matchedRideId;
    journey.matchedRideId = matchedRideId;
    await updateJourneyStatusBasedOnRide(journey);

    const carpoolRide = await CarpoolRide.findById(matchedRideId);
    if (!carpoolRide)
      return res.status(404).json({ message: "Carpool ride not found." });

    const riderId = req.user.userId;

    // Only add rider and update passenger count if not already joined
    if (!carpoolRide.riderIds.some((id) => id.equals(riderId))) {
      carpoolRide.riderIds.push(riderId);
      carpoolRide.passengersCount += journey.passengersCount;
      await carpoolRide.save();

      // Update the existing rider's journey navigation cost
      const otherRiderId = carpoolRide.riderIds.find(
        (id) => !id.equals(riderId)
      );

      if (otherRiderId) {
        const otherJourney = await UserJourney.findOne({
          userId: otherRiderId,
          matchedRideId: carpoolRide._id,
        });

        if (otherJourney) {
          const otherNav = await JourneyNavigation.findOne({
            userJourneyId: otherJourney._id,
          });

          if (otherNav) {
            const perPassengerCost =
              carpoolRide.estimatedPrice / carpoolRide.passengersCount;
            otherNav.totalCostPerPax = perPassengerCost;
            await otherNav.save();
          }
        }
      }
    }

    res.status(200).json({ message: "Ride matched!", userJourney: journey });
  } catch (err) {
    console.error("Update match error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

const leaveMatchedRide = async (req, res) => {
  const userId = req.user.userId;
  const { userJourneyId } = req.params;

  try {
    const journey = await UserJourney.findById(userJourneyId);
    if (!journey)
      return res.status(404).json({ message: "User journey not found." });

    if (journey.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized: can only leave your own journey." });
    }

    if (!journey.matchedRideId) {
      return res
        .status(400)
        .json({ message: "User journey is not matched to any ride." });
    }

    const ride = await CarpoolRide.findById(journey.matchedRideId);
    if (ride) {
      ride.status = "no-match";
      await ride.save();
      const isMainUser = ride.carpoolMainUserId.toString() === userId;

      if (isMainUser) {
        // Clean up for all other riders in the carpool
        for (const riderId of ride.riderIds) {
          if (riderId.toString() === userId) continue;

          const riderJourney = await UserJourney.findOne({
            userId: riderId,
            matchedRideId: ride._id,
          });

          if (riderJourney) {
            riderJourney.status = "pending-selection";
            riderJourney.matchedRideId = null;
            riderJourney.wasResetByMainRider = true;
            await riderJourney.save();

            await JourneyNavigation.deleteOne({
              userJourneyId: riderJourney._id,
            });
          }
        }

        await CarpoolRide.deleteOne({ _id: ride._id });
      } else {
        // Normal rider leaves the ride
        ride.riderIds = ride.riderIds.filter((id) => id.toString() !== userId);
        ride.passengersCount = Math.max(
          0,
          (ride.passengersCount || 0) - (journey.passengersCount || 1)
        );
        await ride.save();

        // Recalculate cost per pax for remaining riders
        for (const remainingRiderId of ride.riderIds) {
          const remainingJourney = await UserJourney.findOne({
            userId: remainingRiderId,
            matchedRideId: ride._id,
          });

          if (remainingJourney) {
            await updateJourneyStatusBasedOnRide(remainingJourney);

            const nav = await JourneyNavigation.findOne({
              userJourneyId: remainingJourney._id,
            });

            if (nav) {
              const perPassengerCost =
                ride.estimatedPrice / ride.passengersCount;
              nav.totalCostPerPax = `$${perPassengerCost.toFixed(2)}`;
              await nav.save();
            }
          }
        }

        // Optional: delete ride if no riders left
        if (ride.riderIds.length === 0) {
          await CarpoolRide.deleteOne({ _id: ride._id });
        }
      }
    }

    // Delete this user's journey navigation (always)
    if (journey.journeyNavigation) {
      await JourneyNavigation.deleteOne({ _id: journey.journeyNavigation });
    } else {
      await JourneyNavigation.deleteOne({ userJourneyId });
    }

    journey.matchedRideId = null;
    journey.status = "pending-selection";
    await journey.save();

    res.status(200).json({
      message: "Successfully left ride and reset journey.",
      userJourney: journey,
    });
  } catch (error) {
    console.error("Error leaving matched ride:", error);
    res.status(500).json({ message: "Server error leaving matched ride." });
  }
};

// Fetch any user journey whose carpool rides wasResetByMainRider
const getJourneysResetByMainRider = async (req, res) => {
  try {
    const affectedJourneys = await UserJourney.find({
      userId: req.user.userId,
      wasResetByMainRider: true,
    });

    // Optionally clear the flag so notifications don’t repeat
    await UserJourney.updateMany(
      { userId: req.user.userId, wasResetByMainRider: true },
      { $set: { wasResetByMainRider: false } }
    );

    res.status(200).json({ affectedJourneys });
  } catch (error) {
    console.error("Error fetching journeys reset by main user:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// Update user journey fields (like preferredDateTime, passengersCount, etc)
const updateUserJourneyFields = async (req, res) => {
  const userId = req.user.userId;
  const { userJourneyId } = req.params;
  const updateData = req.body;

  try {
    const journey = await UserJourney.findById(userJourneyId);
    if (!journey)
      return res.status(404).json({ message: "User journey not found." });

    if (journey.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to edit this journey." });
    }

    // Only allow updating certain fields — whitelist to avoid unwanted changes
    const allowedUpdates = [
      "preferredDateTime",
      "passengersCount",
      "journeyOrigin",
      "journeyDestination",
    ];

    let coordsChanged = false; // Flag to check if coordinates need re-geocoding

    for (const key of allowedUpdates) {
      if (key in updateData) {
        // Check if origin or destination addresses are actually changing
        if (
          (key === "journeyOrigin" && updateData[key] !== journey[key]) ||
          (key === "journeyDestination" && updateData[key] !== journey[key])
        ) {
          coordsChanged = true; // Set flag if an address field is updated
        }
        journey[key] = updateData[key]; // Apply the update to the journey object
      }
    }

    // Only re-geocode if origin or destination addresses have changed
    if (coordsChanged) {
      try {
        journey.journeyOriginCoords = await geocodeAddress(
          journey.journeyOrigin
        );
        journey.journeyDestinationCoords = await geocodeAddress(
          journey.journeyDestination
        );
        console.log("Journey coordinates re-geocoded successfully.");
      } catch (geocodeError) {
        console.error("Geocoding failed during journey update:", geocodeError);
        return res.status(400).json({
          message:
            "Failed to geocode new address. Please check the address format.",
        });
      }
    }

    await journey.save();

    res.status(200).json({
      message: "User journey updated successfully.",
      userJourney: journey,
    });
  } catch (error) {
    console.error("Error updating user journey:", error);
    res.status(500).json({ message: "Server error updating journey." });
  }
};

// --- Delete for solo no-match journeys: Remove user from existi ---
const deleteUserJourney = async (req, res) => {
  try {
    // Define userJourneyId from req.params at the start
    const userJourneyId = req.params.userJourneyId;

    const journey = await UserJourney.findById(userJourneyId);
    if (!journey) return res.status(404).json({ message: "Not found." });

    if (journey.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (journey.matchedRideId) {
      const ride = await CarpoolRide.findById(journey.matchedRideId);
      if (ride) {
        // Remove the current user's ID from the riderIds array
        ride.riderIds = ride.riderIds.filter(
          (id) => id.toString() !== req.user.userId
        );

        if (ride.riderIds.length === 0) {
          // If no riders left, delete the CarpoolRide
          await CarpoolRide.deleteOne({ _id: ride._id });
          console.log(
            `CarpoolRide ${ride._id} deleted as it has no riders left.`
          );
        } else {
          // Otherwise, save the updated ride (with rider removed)
          await ride.save();
        }
      }
    }

    await UserJourney.deleteOne({ _id: userJourneyId });

    // Delete associated JourneyNavigation AFTER UserJourney is successfully deleted

    if (journey.journeyNavigation) {
      // Check if the UserJourney has a linked JourneyNavigation
      await JourneyNavigation.deleteOne({ _id: journey.journeyNavigation });
    } else {
      // Fallback: If for some reason the reference wasn't populated or set,
      // try to find by userJourneyId. This is less precise but provides a fallback.
      await JourneyNavigation.deleteOne({ userJourneyId: userJourneyId }); // Now userJourneyId is defined!
    }

    res.status(200).json({ message: "Deleted journey successfully." });
  } catch (err) {
    console.error("Delete journey error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Error deleting journey." });
    }
  }
};

// --- Mark complete ---
const completeUserJourney = async (req, res) => {
  try {
    const journey = await UserJourney.findById(req.params.userJourneyId);
    if (!journey)
      return res.status(404).json({ message: "Journey not found." });

    if (journey.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (["completed", "cancelled"].includes(journey.status)) {
      return res.status(400).json({ message: `Already ${journey.status}.` });
    }

    journey.status = "completed";
    try {
      console.log("Before save:", journey.status);
      await journey.save();
      console.log("After save:", journey.status);
    } catch (saveError) {
      console.error("Error saving journey:", saveError);
      return res
        .status(500)
        .json({ message: "Failed to save journey status." });
    }

    // Mark carpool ride completed unconditionally if matchedRideId exists
    if (journey.matchedRideId) {
      const ride = await CarpoolRide.findById(journey.matchedRideId);
      if (ride) {
        ride.status = "completed";
        await ride.save();

        // Update all user journeys matched to this ride as completed
        await UserJourney.updateMany(
          { matchedRideId: ride._id, status: { $ne: "completed" } },
          { $set: { status: "completed" } }
        );
      }
    }

    res
      .status(200)
      .json({ message: "Journey completed!", userJourney: journey });
  } catch (err) {
    console.error("Complete error:", err);
    res.status(500).json({ message: "Error completing journey." });
  }
};

module.exports = {
  createUserJourney,
  getUserJourneyById,
  getUserJourneys,
  updateMatchedRideId,
  deleteUserJourney,
  completeUserJourney,
  leaveMatchedRide,
  updateUserJourneyFields,
  getUpcomingJourney, // Export the new function
  getJourneysResetByMainRider,
};
