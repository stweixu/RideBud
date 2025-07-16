const express = require("express");
const router = express.Router();
const {
  registerUserController,
} = require("../../controller/registerUserController");
const validate = require("../../middleware/validate");
const validateRegistration = require("../../validator/validateRegistration");

// POST route for registration
router.post(
  "/",
  validate(validateRegistration), // Validation middleware
  registerUserController // Controller to handle registration logic
);

module.exports = router;
