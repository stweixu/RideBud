const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
  },
  passengers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // References to User model
    },
  ],
  pickupLocation: {
    type: String,
    required: true,
  },
  dropoffLocation: {
    type: String,
    required: true,
  },
  estimatedCost: {
    type: Number,
    required: true,
  },
  rideStatus: {
    type: String,
    enum: ["available", "booked", "completed"],
    default: "available",
  },
  // Add more fields based on your requirements
});

const Ride = mongoose.model("Ride", rideSchema);
module.exports = Ride;
