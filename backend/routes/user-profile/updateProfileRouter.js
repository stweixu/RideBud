const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  updateProfileController,
} = require("../../controller/updateProfileController");
const { verifyToken } = require("../../middleware/authMiddleware");
const validateProfileUpdate = require("../../validator/validateProfileUpdate");
const validate = require("../../middleware/validate");

const upload = multer({ dest: "uploads/" });

router.patch(
  "/",
  verifyToken,
  upload.single("avatar"),
  validate(validateProfileUpdate),
  updateProfileController
); // Get user information route

module.exports = router; // Export the router
