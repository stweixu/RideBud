const mongoose = require("mongoose");

const journeyStepSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String, required: true },
    cost: { type: String, default: "$0.00" },
    icon: { type: String, required: true },
    distance: {
      text: String,
      value: Number,
    },
    eta: { type: String }, // The formatted ETA for this specific step
    start_address: { type: String },
    end_address: { type: String },
    start_location: {
      lat: { type: Number, required: false },
      lng: { type: Number, required: false },
    },
    end_location: {
      lat: { type: Number, required: false },
      lng: { type: Number, required: false },
    },
    // Also, if you want to store the ID for the *matched carpool ride* within its specific step:
    matchedRideId: {
      // This field would only be present for the 'carpool' type step
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarpoolRide",
    },
  },
  { _id: false }
);

const journeyNavigationSchema = new mongoose.Schema(
  {
    userJourneyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserJourney",
      required: true,
    },
    carpoolRideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarpoolRide",
    },
    type: {
      type: String,
      required: true,
      enum: ["fastest-carpool", "balanced-carpool", "other-types"], // expand as needed
    },
    name: { type: String, required: true },
    totalTime: { type: String, required: true },
    totalCostPerPax: { type: String, required: true },
    eta: { type: String, required: true },
    totalDistance: String,
    steps: [journeyStepSchema],
    carpoolRideCost: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JourneyNavigation", journeyNavigationSchema);
