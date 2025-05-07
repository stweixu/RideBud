// validators/registerValidator.js
const { body } = require("express-validator");

const registerValidator = [
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
];

module.exports = registerValidator;
