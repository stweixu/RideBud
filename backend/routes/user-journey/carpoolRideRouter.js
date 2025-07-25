const express = require("express");
const router = express.Router();
const {
  getCarpoolRideDetailsByRideId,
  createCarpoolRide, // Added createCarpoolRide
  getAllCarpoolRides, // Added getAllCarpoolRides
  getCarpoolRidesByUserId, // Added getCarpoolRidesByUserId
  joinCarpoolRide,
} = require("../../controller/carpoolRideController"); // Changed controller path
const { verifyToken } = require("../../middleware/authMiddleware"); // Uncomment if you have auth middleware

// Route to create a new carpool ride
// Example: POST /api/carpool-rides
router.post("/", verifyToken, createCarpoolRide);

// Route to get all carpool rides
// Example: GET /api/carpool-rides
router.get("/all-rides", verifyToken, getAllCarpoolRides); // Protected example

// Route to get a specific carpool ride by ID
// Example: GET /api/carpool-rides/:rideId
router.get("/:rideId", verifyToken, getCarpoolRideDetailsByRideId); // Protected example

// Route to get carpool rides by a specific user ID
router.get("/", verifyToken, getCarpoolRidesByUserId);

router.patch("/:rideId/join", verifyToken, joinCarpoolRide); // Route to join a carpool ride

module.exports = router;
