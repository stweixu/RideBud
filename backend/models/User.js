const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: true,
      minLength: 2,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    dateOfBirth: {
      type: Date,
      required: function () {
        return !this.googleId;
      },
    },
    rating: {
      type: Number,
      default: 0,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 200,
    },
    avatar: {
      type: String, // Will store the URL or base64 string
      default: "https://api.dicebear.com/7.x/avataaars/svg?seed=default", // A default avatar URL
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
