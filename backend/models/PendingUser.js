const mongoose = require("mongoose");
const User = require("./User");

// Clone the schema definition object
const pendingUserSchema = new mongoose.Schema(User.schema.obj);

// Add verification fields BEFORE creating the model
pendingUserSchema.add({
  verifyToken: String,
  verifyExpiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index
  },
});

// Now create the model
const PendingUser = mongoose.model("PendingUser", pendingUserSchema);

module.exports = PendingUser;
