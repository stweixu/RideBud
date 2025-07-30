const User = require("../models/User");
const PendingEmailChange = require("../models/PendingEmailChange");
const jwt = require("jsonwebtoken");

const verifyEmailChangeController = async (req, res) => {
  const { token } = req.query;
  const frontendBaseUrl =
    process.env.FRONTEND_BASE_URL || "http://localhost:5173";

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, newEmail } = decoded;

    // Find the pending email change request
    const pendingChange = await PendingEmailChange.findOne({
      userId: userId,
      newEmail: newEmail,
      token: token,
      expiresAt: { $gt: Date.now() }, // Check if token is not expired
    });

    if (!pendingChange) {
      // If pending change not found or expired, redirect with error
      return res
        .status(400)
        .redirect(
          `${frontendBaseUrl}/profile?email_change_error=true&msg=invalid_or_expired_link`
        );
    }

    // Check if the new email is already taken by another user (edge case: race condition)
    const existingUserWithNewEmail = await User.findOne({ email: newEmail });
    if (
      existingUserWithNewEmail &&
      existingUserWithNewEmail._id.toString() !== userId
    ) {
      // This should ideally be caught earlier in changeEmailController, but good to double check
      await PendingEmailChange.deleteOne({ _id: pendingChange._id }); // Clean up pending record
      return res
        .status(400)
        .redirect(
          `${frontendBaseUrl}/profile?email_change_error=true&msg=email_already_taken`
        );
    }

    // Find the user by ID and update their email
    const user = await User.findById(userId);
    if (!user) {
      await PendingEmailChange.deleteOne({ _id: pendingChange._id }); // Clean up pending record
      return res
        .status(404)
        .redirect(
          `${frontendBaseUrl}/profile?email_change_error=true&msg=user_not_found`
        );
    }

    user.email = newEmail; // Update the user's email
    await user.save();

    // Delete the pending email change record
    await PendingEmailChange.deleteOne({ _id: pendingChange._id });

    // Redirect to profile page with success message
    res.redirect(`${frontendBaseUrl}/profile?email_change_success=true`);
  } catch (err) {
    console.error("Email change verification error:", err);
    // Redirect to profile page with a generic error
    res.redirect(
      `${frontendBaseUrl}/profile?email_change_error=true&msg=verification_failed`
    );
  }
};

module.exports = { verifyEmailChangeController };
