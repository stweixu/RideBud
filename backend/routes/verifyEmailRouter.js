const express = require("express");
const router = express.Router();
const {
  verifyEmailController,
} = require("../controller/verifyEmailController");

router.get("/", verifyEmailController);

module.exports = router;
