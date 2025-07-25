const express = require("express");
const router = express.Router();
const {
  joinMarketplaceRideController,
  getMarketplaceRides,
} = require("../../controller/marketplaceRideController");
const { verifyToken } = require("../../middleware/authMiddleware");

// Route to get marketplace rides
router.get("/get-rides", verifyToken, getMarketplaceRides); // Route to get marketplace rides

router.post("/join-ride", verifyToken, joinMarketplaceRideController);

module.exports = router;
