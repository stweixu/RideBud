const express = require("express");
const router = express.Router();
const {
  registerUserController,
} = require("../controller/registerUserController");
const validate = require("../middleware/validate");
const registerValidator = require("../validator/registerValidator");

// POST route for registration
router.post(
  "/",
  validate(registerValidator), // Validation middleware
  registerUserController // Controller to handle registration logic
);

module.exports = router;
