// controller/forgotPasswordController.js

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { transporter } = require("../utility/email");
const crypto = require("crypto"); // Import crypto module

const sendResetLink = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    // CRITICAL SECURITY CHANGE: Prevent User Enumeration
    // Always return a generic success message, regardless of whether the email was found.
    if (!user) {
      return res.status(200).json({
        message:
          "If an account with that email exists, a password reset link has been sent to it.",
      });
    }

    // 1. Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString("hex"); // 32 bytes = 64 hex chars
    const hashedResetToken = await bcrypt.hash(resetToken, 10); // Hash it for storage

    // 2. Set expiry (e.g., 1 hour from now)
    const resetTokenExpires = Date.now() + 3600000; // 1 hour in milliseconds

    // 3. Save the HASHED token and expiry to the user document
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save(); // Save the updated user

    // 4. Construct the reset link using the UNHASHED token for the email
    // IMPORTANT: Make sure this points to your FRONTEND reset password page
    const frontendBaseUrl =
      process.env.FRONTEND_BASE_URL || "http://localhost:5173"; // Use env var for production
    const resetLink = `${frontendBaseUrl}/reset-password?token=${resetToken}&email=${email}`; // Include email for convenience if needed

    // 5. Send the email with the UNHASHED token
    await transporter.sendMail({
      to: email,
      subject: "Reset your RideBud password",
      text: `You requested a password reset. Please use the following link to reset your password. This link is valid for 1 hour:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
      html: `<p>You requested a password reset. Please use the following link to reset your password. This link is valid for 1 hour:</p><p><a href="${resetLink}">Reset Password Link</a></p><p>If you did not request this, please ignore this email.</p>`,
    });

    return res.status(200).json({
      message:
        "If an account with that email exists, a password reset link has been sent to it.",
    });
  } catch (err) {
    console.error("Error sending reset link:", err); // Log more specific error
    return res.status(500).json({
      message:
        "Could not send reset link at this time. Please try again later.",
    });
  }
};

const resetPassword = async (req, res) => {
  const { token, email, newPassword } = req.body; // Expect email as well, though it can also be derived from JWT if you use JWT for the token

  try {
    // 1. Find the user by email (from the request body or from decoded JWT if token was a JWT)
    const user = await User.findOne({ email });

    // Handle user not found (or potentially tampered email)
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset link." }); // Generic message for security
    }

    // 2. Verify the stored token and its expiry
    // Compare the raw token from the request with the hashed token in the DB
    const isMatch = await bcrypt.compare(token, user.resetPasswordToken);

    if (!isMatch || user.resetPasswordExpires < Date.now()) {
      // Clear token fields immediately if invalid or expired to prevent further attempts
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(400).json({
        message: "Invalid or expired reset link. Please request a new one.",
      });
    }

    // 3. Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update the user's password
    user.password = hashedNewPassword;

    // 5. CRITICAL SECURITY STEP: Invalidate the token by clearing the fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save(); // Save the user with the new password and cleared token fields

    res.status(200).json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("Error resetting password:", err); // Log more specific error
    // Distinguish specific errors if you want to provide more details,
    // e.g., password too short (if you add validation here).
    res.status(500).json({ message: "Server error during password reset." });
  }
};

module.exports = { sendResetLink, resetPassword };
