//validate/validateProfileUpdate.js
const User = require("../models/User"); // Assuming your User model path
const { body } = require("express-validator"); // For validation errors and body method

const validateProfileUpdate = [
  // Display name is required and min 2 characters
  body("displayName")
    .notEmpty()
    .withMessage("Display name is required")
    .isLength({ min: 2 })
    .withMessage("Display name must be at least 2 characters"),

  body("bio")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Bio cannot exceed 200 characters"),

  body("avatar")
    .optional()
    .isString()
    .withMessage("Invalid avatar format (expected string/URL)"), // Changed to isString as frontend sends base64 for preview
];

module.exports = validateProfileUpdate;
