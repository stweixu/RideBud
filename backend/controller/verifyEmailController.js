// controllers/verifyEmailController.js
const PendingUser = require("../models/PendingUser");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const verifyEmailController = async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    const pendingUser = await PendingUser.findOne({ email });

    if (!pendingUser || pendingUser.verifyExpiresAt < Date.now()) {
      return res
        .status(400)
        .redirect("http://localhost:5173/register?error=true");
    }

    // Check if the email is already registered
    const existingUser = await User.findOne({ email: pendingUser.email });
    if (existingUser) {
      return res.status(400).redirect("http://localhost:5173/login?error=true");
    }

    await User.create({
      email: pendingUser.email,
      password: pendingUser.password,
      displayName: pendingUser.displayName,
    });

    await PendingUser.deleteOne({ _id: pendingUser._id });

    res.redirect("http://localhost:5173/login?verified=true");
  } catch (err) {
    console.error(err);
    res.redirect("http://localhost:5173/register?error=true");
  }
};

module.exports = { verifyEmailController };
