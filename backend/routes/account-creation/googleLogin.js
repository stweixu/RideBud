const express = require("express");
const passport = require("passport");
const router = express.Router();
const jwt = require("jsonwebtoken");

const frontendBaseUrl =
  process.env.FRONTEND_BASE_URL || "http://localhost:5173";

router.get(
  "/",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/callback",
  passport.authenticate("google", {
    failureRedirect: `${frontendBaseUrl}/login`,
  }),
  (req, res) => {
    const payload = { userId: req.user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      maxAge: 3600000 * 4,
      path: "/",
    });

    res.redirect(`${frontendBaseUrl}/`);
  }
);

module.exports = router;
