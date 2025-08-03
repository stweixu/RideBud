const User = require("../models/User");

const updateProfileController = async (req, res) => {
  try {
    // req.user.userId populated by authentication middleware
    const userId = req.user.userId;

    const { displayName, bio, avatar } = req.body;

    const updateFields = {};
    if (displayName !== undefined) updateFields.displayName = displayName;
    if (bio !== undefined) updateFields.bio = bio;
    if (avatar !== undefined) {
      // IMPORTANT: If 'avatar' is a base64 string from frontend,
      // you'd typically upload it to cloud storage here and save the URL.
      // For now, we'll save the base64 string directly, but be aware of DB size limits.
      updateFields.avatar = avatar;
    }

    // Find the user and update their profile
    // { new: true } returns the updated document
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password -__v"); // Exclude sensitive fields from the response

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res
      .status(200)
      .json({ message: "Profile updated successfully!", user: updatedUser });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Server error during profile update." });
  }
};

module.exports = { updateProfileController };
