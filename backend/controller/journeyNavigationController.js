// controllers/journeyNavigationController.js

const JourneyNavigation = require("../models/JourneyNavigation");
const CarpoolRide = require("../models/CarpoolRide");
const UserJourney = require("../models/UserJourney");

const selectJourney = async (req, res) => {
  const { userJourneyId, selectedJourney, matchedCarpoolRideId } = req.body;

  // Basic validation to ensure required fields are present
  if (
    !userJourneyId ||
    !selectedJourney || // Check if the entire selectedJourney object is present
    !selectedJourney.type ||
    !selectedJourney.name ||
    !selectedJourney.totalTime ||
    !selectedJourney.totalCostPerPax ||
    !selectedJourney.carpoolRideCost ||
    !selectedJourney.eta ||
    !selectedJourney.totalDistance ||
    !selectedJourney.steps
  ) {
    return res
      .status(400)
      .json({ message: "Missing required fields for selected journey." });
  }

  try {
    // Construct the data to save/update from the `selectedJourney` object
    const journeyDataToSave = {
      userJourneyId: userJourneyId,
      type: selectedJourney.type,
      name: selectedJourney.name,
      totalTime: selectedJourney.totalTime,
      totalCostPerPax: selectedJourney.totalCostPerPax,
      carpoolRideCost: selectedJourney.carpoolRideCost,
      eta: selectedJourney.eta,
      totalDistance: selectedJourney.totalDistance,
      steps: selectedJourney.steps,
      journeyDepartureTime: selectedJourney.departureTime,
      matchedRideId: matchedCarpoolRideId,
    };

    const query = {
      userJourneyId: userJourneyId,
      type: selectedJourney.type, // Use type from the selectedJourney object
    };
    const update = { $set: journeyDataToSave };
    const options = { upsert: true, new: true, runValidators: true };

    const savedJourney = await JourneyNavigation.findOneAndUpdate(
      query,
      update,
      options
    );

    const updatedUserJourney = await UserJourney.findByIdAndUpdate(
      userJourneyId,
      {
        $set: {
          journeyNavigation: savedJourney._id,
          preferredDateTime: selectedJourney.departureTime,
        },
      },
      { new: true, runValidators: true } // Return the updated document and run validators
    );

    if (!updatedUserJourney) {
      return res
        .status(404)
        .json({ message: "Associated User Journey not found for update." });
    }

    res.status(201).json({
      message: "Journey selected and saved successfully!",
      journey: savedJourney,
    });
  } catch (error) {
    console.error("Error saving selected journey:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error saving selected journey." });
  }
};

/**
 * GET /api/journey-navigations/:userJourneyId
 * Retrieves all JourneyNavigation documents associated with a specific userJourneyId.
 */
const getJourneyNavigationsForUserJourney = async (req, res) => {
  const { userJourneyId } = req.params;

  try {
    // 1. Find the UserJourney document by userJourneyId
    const userJourney = await UserJourney.findById(userJourneyId)
      // 2. Populate the 'journeyNavigation' field to get the actual JourneyNavigation details
      .populate("journeyNavigation")
      .populate("matchedRideId"); // Populate matchedRideId

    if (!userJourney) {
      return res.status(404).json({ message: "User Journey not found." });
    }

    if (!userJourney.journeyNavigation) {
      // If the userJourney exists but no navigation has been selected/linked
      return res.status(404).json({
        message: "No selected journey navigation found for this user journey.",
      });
    }

    // Return the populated JourneyNavigation document
    res.status(200).json({
      userJourney: {
        _id: userJourney._id,
        userId: userJourney.userId,
        journeyOrigin: userJourney.journeyOrigin,
        journeyDestination: userJourney.journeyDestination,
        preferredDateTime: userJourney.preferredDateTime,
        status: userJourney.status,
        matchedRideId: userJourney.matchedRideId,
        passengersCount: userJourney.matchedRideId.passengersCount,
      },
      journeyNavigation: userJourney.journeyNavigation,
    });
  } catch (error) {
    console.error("Error fetching journey navigation:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        message:
          "Invalid User Journey ID format or Journey Navigation ID format.",
      });
    }
    res
      .status(500)
      .json({ message: "Server error fetching journey navigation." });
  }
};

/**
 * DELETE /api/journey-navigations/:journeyNavigationId
 * Deletes a specific JourneyNavigation document.
 * If the deleted navigation was a carpool type, it will also attempt to "leave" the associated carpool ride.
 */
const deleteJourneyNavigation = async (req, res) => {
  const { journeyNavigationId } = req.params;

  try {
    const journeyNav = await JourneyNavigation.findById(journeyNavigationId);

    if (!journeyNav) {
      return res.status(404).json({ message: "Journey navigation not found." });
    }

    // Delete the JourneyNavigation document
    await JourneyNavigation.deleteOne({ _id: journeyNavigationId }); // Or findByIdAndDelete(journeyNavigationId)

    res
      .status(200)
      .json({ message: "Journey navigation deleted successfully." });
  } catch (error) {
    console.error("Error deleting journey navigation:", error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ message: "Invalid Journey Navigation ID format." });
    }
    res
      .status(500)
      .json({ message: "Server error deleting journey navigation." });
  }
};

module.exports = {
  selectJourney,
  getJourneyNavigationsForUserJourney,
  deleteJourneyNavigation, // Export the new delete function
};
