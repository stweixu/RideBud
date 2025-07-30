const User = require("../models/User");
const PendingEmailChange = require("../models/PendingEmailChange"); // New model
const { transporter } = require("../utility/email");
const jwt = require("jsonwebtoken");

const changeEmailController = async (req, res) => {
  const { newEmail } = req.body;
  const userId = req.user.userId; // Correctly get userId from authenticated token

  try {
    // 1. Find the current user to ensure they exist
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    // 2. Check if the new email is already in use by another active user
    const existingUserWithNewEmail = await User.findOne({ email: newEmail });
    if (
      existingUserWithNewEmail &&
      existingUserWithNewEmail._id.toString() !== userId
    ) {
      return res.status(400).json({
        msg: "This email address is already registered by another user.",
      });
    }

    // 3. Check if the new email is the same as the current email
    if (user.email === newEmail) {
      return res
        .status(400)
        .json({ msg: "New email cannot be the same as current email." });
    }

    // 4. Generate a JWT for email change verification
    // Payload includes userId and newEmail
    const token = jwt.sign(
      { userId: user._id, newEmail: newEmail },
      process.env.JWT_SECRET,
      { expiresIn: "10m" } // Token expires in 10 minutes
    );

    // 5. Store the pending email change request
    // Use upsert to update if a pending change for this user/newEmail already exists
    await PendingEmailChange.updateOne(
      { userId: user._id }, // Find by userId
      {
        $set: {
          newEmail: newEmail,
          token: token,
          expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes from now
        },
      },
      { upsert: true } // Create if not found, update if found
    );

    // 6. Construct the verification link for the new dedicated endpoint
    const verifyLink = `${process.env.API_BASE_URL}/verify-email-change?token=${token}`;

    // 7. Send verification email to the NEW email address
    await transporter.sendMail({
      to: newEmail,
      subject: "Verify your new email for RideBud",
      text: `Click this link to verify and change your email: ${verifyLink}`,
      html: `<p>Please verify your new email by clicking on this link: <a href="${verifyLink}">${verifyLink}</a></p>`,
    });

    return res
      .status(200)
      .json({ message: "Verification link sent to your new email address." });
  } catch (err) {
    console.error("Error in changeEmailController:", err);
    return res
      .status(500)
      .json({ message: "Server error during email change." });
  }
};

module.exports = { changeEmailController };
