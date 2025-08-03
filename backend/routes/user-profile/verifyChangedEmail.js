const express = require("express");
const router = express.Router();
const {
  verifyEmailChangeController,
} = require("../../controller/verifyEmailChangeController");

router.get(
  "/", // This will be mounted under /api/verify-email-change
  verifyEmailChangeController
);

module.exports = router;
