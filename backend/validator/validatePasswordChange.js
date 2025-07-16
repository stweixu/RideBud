// validators/changePasswordValidator.js
const { body } = require("express-validator");

const validatePasswordChange = [
  body("oldPassword").notEmpty().withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];

module.exports = validatePasswordChange;
