const express = require("express");
const router = express.Router();
const {
  createUserJourney,
  getUserJourneyById,
  getUserJourneys,
  updateMatchedRideId,
  deleteUserJourney,
  completeUserJourney,
  leaveMatchedRide,
  updateUserJourneyFields,
  getUpcomingJourney,
  getJourneysResetByMainRider,
} = require("../../controller/userJourneyController");
const {
  selectJourney,
  getJourneyNavigationsForUserJourney,
  deleteJourneyNavigation,
} = require("../../controller/journeyNavigationController");
const { verifyToken } = require("../../middleware/authMiddleware"); // Import the authentication middleware

// Route to create a new user journey request
// Example: POST /api/user-journeys
router.post("/", verifyToken, createUserJourney); // PROTECTED: userId will now come from req.user.userId

router.get("/upcoming", verifyToken, getUpcomingJourney); // PROTECTED: Get upcoming journeys

router.get("/reset-by-main-rider", verifyToken, getJourneysResetByMainRider);

// Route to get a specific user journey by ID
// Example: GET /api/user-journeys/:userJourneyId
router.get("/:userJourneyId", verifyToken, getUserJourneyById);

// Route to get all user journeys for the authenticated user
// Example: GET /api/user-journeys
router.get("/", verifyToken, getUserJourneys);

// Route to update a user journey's matchedRideId
// Example: PATCH /api/user-journeys/:userJourneyId/match
router.patch("/:userJourneyId/match", verifyToken, updateMatchedRideId);

// NEW: Route to delete a user journey
// Example: DELETE /api/user-journeys/:userJourneyId
router.delete("/:userJourneyId", verifyToken, deleteUserJourney); // PROTECTED

// NEW: Route to mark a user journey as completed
// Example: PATCH /api/user-journeys/:userJourneyId/complete
router.patch("/:userJourneyId/complete", verifyToken, completeUserJourney); // PROTECTED

router.post("/:userJourneyId/leave-ride", verifyToken, leaveMatchedRide);

router.patch("/:userJourneyId", verifyToken, updateUserJourneyFields);

router.post("/select", verifyToken, selectJourney);

// Route to fetch previously saved journey navigations (for user's history/selected journeys)
router.get("/navigate/:userJourneyId", getJourneyNavigationsForUserJourney);

router.delete(
  "/delete/:journeyNavigationId", // Use the ID of the JourneyNavigation document itself
  deleteJourneyNavigation
);

module.exports = router;
