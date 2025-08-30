const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const loginUserController = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Email or password is incorrect" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Email or password is incorrect" });
    }

    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction, // HTTPS in production
      sameSite: isProduction ? "None" : "Lax",
      maxAge: 3600000 * 4,
      path: "/",
    });

    res.status(200).json({
      msg: "Login successful",
      user: {
        id: user._id,
        name: user.displayName,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = { loginUserController };
