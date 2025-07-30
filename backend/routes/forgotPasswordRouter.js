const express = require("express");
const router = express.Router();
const validatePasswordReset = require("../validator/validatePasswordReset");
const validate = require("../middleware/validate");
const {
  sendResetLink,
  resetPassword,
} = require("../controller/forgotPasswordController");

router.post("/send-reset-link", sendResetLink);

router.patch("/reset-password", validate(validatePasswordReset), resetPassword);

module.exports = router;
