const express = require("express");
const router = express.Router();
const { logOutController } = require("../../controller/logoutController"); // Import the logOutController

router.post("/", logOutController); // Log out route

module.exports = router; // Export the router
