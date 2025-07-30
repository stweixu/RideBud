//controller/changePasswordController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const changePasswordController = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.userId; // Assuming user ID is available in req.user

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check if the current password matches
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Current password is incorrect" });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ msg: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = { changePasswordController };
