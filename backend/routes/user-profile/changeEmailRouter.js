const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middleware/authMiddleware");
const {
  changeEmailController,
} = require("../../controller/changeEmailController");
const validate = require("../../middleware/validate");
const validateEmailChange = require("../../validator/validateEmailChange");

router.patch(
  "/", // mounted under /api/change-email
  verifyToken,
  validate(validateEmailChange),
  changeEmailController
);

module.exports = router;
