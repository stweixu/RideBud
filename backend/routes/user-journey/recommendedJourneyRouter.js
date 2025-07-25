const express = require("express");
const router = express.Router();
const {
  getRecommendationsForUserJourney,
} = require("../../controller/recommendedJourneyController");
const { verifyToken } = require("../../middleware/authMiddleware"); // Assuming you want to protect this route

// Route to get all recommended journeys for a specific userJourneyId
// Example: GET /api/recommended-journeys/:userJourneyId
router.get("/:userJourneyId", verifyToken, getRecommendationsForUserJourney);

module.exports = router;
