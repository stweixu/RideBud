// validators/changeEmailValidator.js
const { body } = require("express-validator");

const validateEmailChange = [
  body("newEmail")
    .notEmpty()
    .withMessage("New email is required")
    .isEmail()
    .withMessage("Invalid email format"),
];

module.exports = validateEmailChange;
