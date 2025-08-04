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
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const payload = { userId: req.user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 3600000 * 4,
      path: "/",
    });
    // Successful login, redirect frontend or send JSON
    res.redirect(`${frontendBaseUrl}/`);
  }
);

module.exports = router;
