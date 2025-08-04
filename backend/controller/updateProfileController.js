const User = require("../models/User");
const cloudinary = require("../utility/cloudinary");
const { transporter } = require("../utility/email");
const fs = require("fs");

// Extracts the public ID from a Cloudinary URL
function extractCloudinaryPublicId(url) {
  // Example URL: https://res.cloudinary.com/<cloud_name>/image/upload/v1234567890/folder/filename.jpg
  // We want to get: folder/filename (without extension and version)

  // Remove the prefix till /upload/
  const parts = url.split("/upload/");
  if (parts.length < 2) return null;

  // Get path after /upload/
  let path = parts[1];

  // Remove file extension (like .jpg)
  path = path.substring(0, path.lastIndexOf("."));

  // Remove version prefix if exists (like v1234567890/)
  const versionIndex = path.indexOf("v");
  if (versionIndex === 0) {
    path = path.substring(path.indexOf("/") + 1);
  }

  return path;
}

const updateProfileController = async (req, res) => {
  try {
    // req.user.userId populated by authentication middleware
    const userId = req.user.userId;
    const updateFields = {};

    if (req.file) {
      const results = await cloudinary.uploader.upload(req.file.path, {
        folder: "ridebud/avatars",
      });
      const avatarUrl = results.secure_url;
      updateFields.avatar = avatarUrl;

      fs.unlinkSync(req.file.path);
      /*
      const user = await User.findById(userId);
      if (user?.avatar) {
        const publicId = extractCloudinaryPublicId(user.avatar); // You'll need a helper to parse it
        await cloudinary.uploader.destroy(publicId);
      } 

    */
    }

    const { displayName, bio } = req.body;

    if (displayName !== undefined) updateFields.displayName = displayName;
    if (bio !== undefined) updateFields.bio = bio;

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
