const CarpoolRide = require("../models/CarpoolRide");
const UserJourney = require("../models/UserJourney");
const JourneyNavigation = require("../models/JourneyNavigation");
const mongoose = require("mongoose");
const { enrichCarpoolRideWithBuddyInfo } = require("./carpoolRideController");

const joinMarketplaceRideController = async (req, res) => {
  const userId = req.user.userId;
  const { matchedRideId } = req.body;

  try {
    // Find the carpool ride by ID
    const carpoolRide = await CarpoolRide.findById(matchedRideId);
    if (!carpoolRide) {
      return res.status(404).json({ msg: "Carpool ride not found." });
    }

    // Find main user journey for the carpoolMainUserId linked to this ride
    const mainUserJourney = await UserJourney.findOne({
      matchedRideId: matchedRideId,
      userId: carpoolRide.carpoolMainUserId,
    });
    if (!mainUserJourney) {
      return res.status(404).json({ msg: "Main user journey not found." });
    }

    // Update mainUserJourney status
    mainUserJourney.status = "matched";
    await mainUserJourney.save();

    // Find JourneyNavigation linked to mainUserJourney
    const mainUserJourneyNavigation = await JourneyNavigation.findById(
      mainUserJourney.journeyNavigation
    );
    if (!mainUserJourneyNavigation) {
      return res.status(404).json({ msg: "Journey navigation not found." });
    }

    // Add the user to the carpool ride's riders if not already present
    if (!carpoolRide.riderIds.includes(userId)) {
      carpoolRide.riderIds.push(userId);
      carpoolRide.passengersCount += 1;
    }
    carpoolRide.status = "matched";
    await carpoolRide.save();

    if (mainUserJourneyNavigation && carpoolRide.passengersCount > 0) {
      const perPassengerCost =
        carpoolRide.totalCost / carpoolRide.passengersCount;
      mainUserJourneyNavigation.cost = perPassengerCost;
      await mainUserJourneyNavigation.save();
    }

    // Duplicate JourneyNavigation
    const journeyNavigationObj = mainUserJourneyNavigation.toObject();
    delete journeyNavigationObj._id;
    delete journeyNavigationObj.createdAt;
    delete journeyNavigationObj.updatedAt;

    const journeyNavigationData = new JourneyNavigation(journeyNavigationObj);
    await journeyNavigationData.save();

    // Duplicate UserJourney linked to mainUserJourney but for new user
    const userJourneyObj = mainUserJourney.toObject();
    delete userJourneyObj._id;
    delete userJourneyObj.createdAt;
    delete userJourneyObj.updatedAt;
    userJourneyObj.journeyNavigation = journeyNavigationData._id; // link to new navigation
    userJourneyObj.userId = userId;
    userJourneyObj.passengersCount = 1;
    userJourneyObj.status = "matched";

    const userJourneyData = new UserJourney(userJourneyObj);
    await userJourneyData.save();

    // Link duplicated UserJourney to duplicated JourneyNavigation
    journeyNavigationData.userJourneyId = userJourneyData._id;
    await journeyNavigationData.save();

    return res.status(200).json({
      msg: "Successfully joined the marketplace ride.",
      journeyNavigationId: journeyNavigationData._id,
      userJourneyId: userJourneyData._id,
    });
  } catch (error) {
    console.error("Error joining marketplace ride:", error);
    return res.status(500).json({ msg: "Internal server error." });
  }
};

// radius for both pickup- and drop‑off proximity in kilometres
const RADIUS_KM = 10;

const getMarketplaceRides = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      sortBy = "nearest",
      pickUpLat,
      pickUpLng,
      dropOffLat,
      dropOffLng,
      departureDateTime,
    } = req.query;

    // ---------- Base filter ----------
    const filter = {
      status: "no-match",
    };
    if (userId) {
      filter.riderIds = { $nin: [new mongoose.Types.ObjectId(userId)] };
    }

    if (departureDateTime)
      filter.carpoolStartTime = { $gte: new Date(departureDateTime) };

    // ---------- Coordinates ----------
    const pickupCoords =
      pickUpLat && pickUpLng
        ? [parseFloat(pickUpLng), parseFloat(pickUpLat)]
        : null;

    const dropoffCoords =
      dropOffLat && dropOffLng
        ? [parseFloat(dropOffLng), parseFloat(dropOffLat)]
        : null;

    let carpoolRides;

    // ============== GEO path (pickup supplied) ==============
    if (pickupCoords) {
      // Build aggregation pipeline
      const pipeline = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: pickupCoords },
            distanceField: "distanceFromPickup",
            spherical: true,
            query: filter,
            maxDistance: RADIUS_KM * 1000, // meters
            key: "carpoolPickupCoords",
          },
        },
      ];

      // Optional drop‑off filtering
      if (dropoffCoords) {
        pipeline.push({
          $match: {
            carpoolDropoffCoords: {
              $geoWithin: {
                $centerSphere: [dropoffCoords, RADIUS_KM / 6371], // radians
              },
            },
          },
        });
      }

      // Sorting
      if (sortBy === "earliest") {
        pipeline.push({ $sort: { carpoolStartTime: 1 } });
      } else if (sortBy === "lowestPrice") {
        pipeline.push({ $sort: { estimatedPrice: 1 } });
      } else if (sortBy === "highestPrice") {
        pipeline.push({ $sort: { estimatedPrice: -1 } });
      } else {
        // "nearest" or default
        pipeline.push({ $sort: { distanceFromPickup: 1 } });
      }

      carpoolRides = await CarpoolRide.aggregate(pipeline);
    }
    // ============== Non‑geo path (no pickup supplied) ==============
    else {
      let query = CarpoolRide.find(filter);

      // Drop‑off filtering still possible (bounding box)
      if (dropoffCoords) {
        query = query.find({
          carpoolDropoffCoords: {
            $geoWithin: {
              $centerSphere: [dropoffCoords, RADIUS_KM / 6371],
            },
          },
        });
      }

      // Sorting
      if (sortBy === "earliest") query.sort({ carpoolStartTime: 1 });
      else if (sortBy === "lowestPrice") query.sort({ estimatedPrice: 1 });
      else if (sortBy === "highestPrice") query.sort({ estimatedPrice: -1 });
      else query.sort({ createdAt: -1 }); // newest

      carpoolRides = await query.exec();
    }

    // ---------- Enrich with buddy info ----------
    const enrichedRides = await Promise.all(
      carpoolRides.map((ride) => enrichCarpoolRideWithBuddyInfo(ride))
    );

    return res.status(200).json({ success: true, data: enrichedRides });
  } catch (error) {
    console.error("Error fetching marketplace rides:", error);
    return res
      .status(500)
      .json({ message: "Server error fetching carpool rides." });
  }
};

module.exports = { joinMarketplaceRideController, getMarketplaceRides };
