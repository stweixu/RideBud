const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middleware/authMiddleware"); // Import the authentication middleware

router.get("/", verifyToken, (req, res) => {
  // If the user is authenticated, send a success response
  res.status(200).json({ isAuthenticated: true, user: req.user });
});

module.exports = router;
// This router checks if the user is authenticated and returns their information
