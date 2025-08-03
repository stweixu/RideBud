const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); 

const loginUserController = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Email or password is incorrect" });
    }

    // 2. Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Email or password is incorrect" });
    }

    // 3. Generate JWT token
    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });

    // 4. Set the JWT token as an httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      // secure: process.env.NODE_ENV === "production", 
      // Ensure cookies are sent over HTTPS in production
      sameSite: "Strict", // Prevents CSRF attacks
      maxAge: 3600000 * 4, // Set the expiry time, 4 hours
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
