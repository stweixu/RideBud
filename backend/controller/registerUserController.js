const bcrypt = require("bcryptjs");
const PendingUser = require("../models/PendingUser");
const User = require("../models/User");
const { transporter } = require("../utility/email");
const jwt = require("jsonwebtoken");

const registerUserController = async (req, res) => {
  const { displayName, email, password, dateOfBirth } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });
    // OR: const token = crypto.randomBytes(32).toString("hex");

    await PendingUser.updateOne(
      { email },
      {
        $set: {
          displayName,
          password: hashedPassword,
          dateOfBirth,
          verifyToken: token,
          verifyExpiresAt: Date.now() + 10 * 60 * 1000,
        },
      },
      { upsert: true }
    );

    const verifyLink = `${process.env.FRONTEND_BASE_URL}/verify?token=${token}`;

    await transporter.sendMail({
      to: email,
      subject: "Verify your RideBud account",
      text: `Click this link to verify your email: ${verifyLink}`,
    });

    return res.status(201).json({ message: "Email link sent successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerUserController };
