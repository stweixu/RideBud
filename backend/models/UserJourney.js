const mongoose = require("mongoose");

const userJourneySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    journeyOrigin: {
      // The user's overall journey starting point
      type: String,
      required: true,
    },
    journeyDestination: {
      // The user's overall journey ending point
      type: String,
      required: true,
    },
    journeyOriginCoords: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    journeyDestinationCoords: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    preferredDateTime: {
      // Combined preferred date and time
      type: Date,
      required: true,
    },
    passengersCount: {
      // Number of passengers for this specific journey request
      type: Number,
      min: 1,
      max: 2,
      default: 1,
    },
    status: {
      type: String,
      enum: [
        "pending-selection",
        "no-match",
        "matched",
        "completed",
        "cancelled",
      ],
      default: "pending-selection",
    },
    wasResetByMainRider: {
      // Indicates if this journey was reset by the main rider
      type: Boolean,
      default: false,
    },
    // Optional: Reference to a CarpoolRide if this UserJourney has been matched with one
    matchedRideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarpoolRide", // Changed from 'Ride' to 'CarpoolRide'
      required: false,
    },
    journeyNavigation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JourneyNavigation",
      required: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

userJourneySchema.index({ journeyOriginCoords: "2dsphere" });
userJourneySchema.index({ journeyDestinationCoords: "2dsphere" });

const UserJourney = mongoose.model("UserJourney", userJourneySchema);

module.exports = UserJourney;
