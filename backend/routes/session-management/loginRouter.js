const express = require("express");
const router = express.Router();
const { loginUserController } = require("../../controller/loginController");

// Normal login route
router.post("/", loginUserController);

// Guest login route
router.post("/guest", async (req, res) => {
  try {
    // Hardcoded guest credentials, never exposed to frontend
    req.body.email = "ridebudtester@outlook.com";
    req.body.password = "Testpass12!";

    await loginUserController(req, res); // Reuse existing login logic
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Guest login failed" });
  }
});

module.exports = router;
