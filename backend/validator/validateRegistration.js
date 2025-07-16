// validators/registerValidator.js
const { body } = require("express-validator");
const { validate } = require("../models/User");

const twelveYearsAgo = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 12);
  return date;
};

const validateRegistration = [
  body("displayName")
    .notEmpty()
    .withMessage("Display name is required")
    .isLength({ min: 2 })
    .withMessage("Display name must be at least 2 characters"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm Password is required")
    .custom((val, { req }) => {
      if (val !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  body("dateOfBirth")
    .notEmpty()
    .withMessage("Date of birth is required")
    .isISO8601() // Ensures it's a valid date string in ISO format (e.g., "YYYY-MM-DD")
    .toDate() // Converts the string to a Date object
    .withMessage("Invalid date of birth format")
    .custom((value) => {
      // 'value' here will be a Date object after .toDate()
      if (value > twelveYearsAgo()) {
        throw new Error("You must be at least 12 years old to register.");
      }
      return true;
    }),
];

module.exports = validateRegistration;
