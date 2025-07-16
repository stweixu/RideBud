const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middleware/authMiddleware");
const {
  changeEmailController,
} = require("../../controller/changeEmailController"); // New controller
const validate = require("../../middleware/validate");
const validateEmailChange = require("../../validator/validateEmailChange"); // New validator

router.patch(
  "/", // This will be mounted under /api/change-email
  verifyToken,
  validate(validateEmailChange),
  changeEmailController
);

module.exports = router;
