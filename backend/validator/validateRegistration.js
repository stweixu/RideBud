// validators/registerValidator.js
const { body } = require("express-validator");
const { validate } = require("../models/User");

const eighteenYearsAgo = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 17);
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
    .custom((password) => {
      const allowedSymbols = "~!@#$%^&";
      const symbolRegex = new RegExp(
        `[${allowedSymbols.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&")}]`
      );

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      if (!/[A-Z]/.test(password)) {
        throw new Error("Password must include at least one uppercase letter");
      }
      if (!/[a-z]/.test(password)) {
        throw new Error("Password must include at least one lowercase letter");
      }
      if (!/\d/.test(password)) {
        throw new Error("Password must include at least one number");
      }
      if (!symbolRegex.test(password)) {
        throw new Error(
          `Password must include at least one special symbol: ${allowedSymbols}`
        );
      }
      return true;
    }),

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
      if (value > eighteenYearsAgo()) {
        throw new Error("You must be at least 18 years old to register.");
      }
      return true;
    }),
];

module.exports = validateRegistration;
