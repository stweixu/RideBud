// controllers/journeyNavigationController.js

const JourneyNavigation = require("../models/JourneyNavigation");
const CarpoolRide = require("../models/CarpoolRide");
const UserJourney = require("../models/UserJourney");

/**
 * Saves or updates a JourneyNavigation document based on user selection.
 * This function is intended to be called when a user explicitly selects a journey.
 *
 * @param {Object} req - Express request object (should contain the selected journey data in req.body).
 * @param {Object} res - Express response object.
 */
const selectJourney = async (req, res) => {
  const { userJourneyId, selectedJourney, matchedCarpoolRideId } = req.body; // Destructure directly

  // Basic validation to ensure required fields are present
  if (
    !userJourneyId ||
    !selectedJourney || // Check if the entire selectedJourney object is present
    !selectedJourney.type ||
    !selectedJourney.name ||
    !selectedJourney.totalTime ||
    !selectedJourney.totalCostPerPax ||
    !selectedJourney.carpoolRideCost || // Ensure carpoolRideCost is present
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
      carpoolRideCost: selectedJourney.carpoolRideCost, // Assuming this is part of the selectedJourney
      eta: selectedJourney.eta,
      totalDistance: selectedJourney.totalDistance,
      steps: selectedJourney.steps,
      journeyDepartureTime: selectedJourney.departureTime, // Ensure this is included
      // Add the matchedCarpoolRideId to the JourneyNavigation document if it's part of its schema
      matchedRideId: matchedCarpoolRideId, // Assuming you have a 'carpoolRideId' field in JourneyNavigation model
    };

    const query = {
      userJourneyId: userJourneyId,
      type: selectedJourney.type, // Use type from the selectedJourney object
    };
    const update = { $set: journeyDataToSave }; // Use the constructed object for update
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
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getJourneyNavigationsForUserJourney = async (req, res) => {
  const { userJourneyId } = req.params;

  try {
    // 1. Find the UserJourney document by userJourneyId
    const userJourney = await UserJourney.findById(userJourneyId)
      // 2. Populate the 'journeyNavigation' field to get the actual JourneyNavigation details
      .populate("journeyNavigation") // Assuming 'journeyNavigation' is the ref field in UserJourney
      .populate("matchedRideId"); // Populate matchedRideId if needed

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
        // <-- Frontend expects this
        _id: userJourney._id,
        userId: userJourney.userId,
        journeyOrigin: userJourney.journeyOrigin,
        journeyDestination: userJourney.journeyDestination,
        preferredDateTime: userJourney.preferredDateTime,
        status: userJourney.status,
        matchedRideId: userJourney.matchedRideId, // Include if needed by frontend
        passengersCount: userJourney.matchedRideId.passengersCount, // Include if needed by frontend
        // Add any other UserJourney fields that JourneyNavigationPage needs
      },
      journeyNavigation: userJourney.journeyNavigation, // <-- Frontend expects this
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
 *
 * @param {Object} req - Express request object (expects journeyNavigationId in params).
 * @param {Object} res - Express response object.
 */
const deleteJourneyNavigation = async (req, res) => {
  const { journeyNavigationId } = req.params;
  // Assuming you have user information in req.user from authentication middleware
  // const userId = req.user._id; // <--- Uncomment if you have auth and want to verify ownership

  try {
    const journeyNav = await JourneyNavigation.findById(journeyNavigationId);

    if (!journeyNav) {
      return res.status(404).json({ message: "Journey navigation not found." });
    }

    // Optional: Add ownership check if you have authentication
    // if (journeyNav.userJourneyId.toString() !== userId.toString()) {
    //   return res.status(403).json({ message: "Unauthorized to delete this journey navigation." });
    // }

    // Check if this journey navigation was associated with a carpool ride
    // The carpoolRideId is stored at the root of JourneyNavigation,
    // and/or matchedRideId is stored within the carpool step.
    const carpoolRideIdToLeave =
      journeyNav.carpoolRideId ||
      journeyNav.steps.find((s) => s.type === "carpool")?.matchedRideId;

    if (carpoolRideIdToLeave) {
      console.log(
        `Attempting to leave carpool ride ${carpoolRideIdToLeave} associated with JourneyNavigation ${journeyNavigationId}`
      );
      // Call a function from your carpoolRideController to handle leaving the ride
      // This is a placeholder. You'll need to implement actual leaveRide logic in carpoolRideController.
      // Example: await leaveRide(carpoolRideIdToLeave, journeyNav.userJourneyId);
      // Or, if leaveRide is a method on CarpoolRide model:
      try {
        const carpoolRide = await CarpoolRide.findById(carpoolRideIdToLeave);
        if (carpoolRide) {
          // Assuming CarpoolRide has a passengers array and you want to remove the userJourneyId from it
          // Or, if it's a simple match, you might just mark the carpool as no longer matched to this userJourney
          // For simplicity, let's assume you'd update the CarpoolRide to reflect the user leaving.
          // This logic depends heavily on how your CarpoolRide model manages passengers/matches.
          // For example, if you have a `passengers` array of `UserJourney` IDs:
          // carpoolRide.passengers.pull(journeyNav.userJourneyId);
          // await carpoolRide.save();
          // Or if you have a specific "leave" method:
          // await carpoolRide.leavePassenger(journeyNav.userJourneyId);
          console.log(
            `[ACTION REQUIRED]: Implement actual leave ride logic for carpoolRideId ${carpoolRideIdToLeave}`
          );
          // For now, we'll just log this, but in a real app, this is where you'd update the CarpoolRide.
        }
      } catch (leaveError) {
        console.error(
          `Error attempting to leave carpool ride ${carpoolRideIdToLeave}:`,
          leaveError
        );
        // Decide how to handle this:
        // 1. Fail the delete operation if leaving the ride is critical.
        // 2. Log the error and proceed with deleting JourneyNavigation (less strict).
        // For now, we'll log and proceed.
      }
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
