const express = require("express");
const router = express.Router();
const {
  updateProfileController,
} = require("../../controller/updateProfileController");
const { verifyToken } = require("../../middleware/authMiddleware");
const validateProfileUpdate = require("../../validator/validateProfileUpdate");
const validate = require("../../middleware/validate");

router.patch(
  "/",
  verifyToken,
  validate(validateProfileUpdate),
  updateProfileController
); // Get user information route

module.exports = router; // Export the router
