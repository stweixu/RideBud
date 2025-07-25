const express = require("express");
const router = express.Router();
const {
  // CORRECTED: Import getJourneyRecommendations instead of getDetailedDirections
  getJourneyRecommendations,
  geocodeLatLngToAddress,
} = require("../../controller/directionsController");
// const { verifyToken } = require("../middleware/authMiddleware"); // Uncomment if you have auth middleware

// Route to get detailed journey recommendations (now returns multiple options)
// Example: GET /api/directions?origin=A&destination=B
// router.get("/", verifyToken, getJourneyRecommendations); // If protected
router.get("/", getJourneyRecommendations); // If not protected for now

// Route to geocode LatLng to address (used by "Use Current Location" button)
// Example: GET /api/directions/geocode?lat=1.23&lng=103.45
// router.get("/geocode", verifyToken, geocodeLatLngToAddress); // If protected
router.get("/geocode", geocodeLatLngToAddress); // If not protected for now

module.exports = router;
