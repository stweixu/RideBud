const mongoose = require("mongoose");

const pendingEmailChangeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // Reference to the User model
    },
    newEmail: {
      type: String,
      required: true,
      unique: true, // Ensure no two pending changes for the same new email
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

const PendingEmailChange = mongoose.model(
  "PendingEmailChange",
  pendingEmailChangeSchema
);

module.exports = PendingEmailChange;
