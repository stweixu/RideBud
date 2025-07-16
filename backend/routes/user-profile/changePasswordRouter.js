//routes/user-profile/changePasswordRouter.js

const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middleware/authMiddleware"); // Import the authentication middleware
const {
  changePasswordController,
} = require("../../controller/changePasswordController");
const validate = require("../../middleware/validate");
const validatePasswordChange = require("../../validator/validatePasswordChange"); // Import validation rules

router.patch(
  "/",
  verifyToken,
  validate(validatePasswordChange),
  changePasswordController
); // Change password route

router.get("/", (req, res) => {
  res.json({ msg: "change-password router is working" });
});

module.exports = router; // Export the router
