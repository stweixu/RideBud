const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    carpoolMainUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    carpoolPickupLocation: {
      type: String,
      required: true,
    },
    carpoolDropoffLocation: {
      type: String,
      required: true,
    },
    carpoolPickupCoords: {
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
    carpoolDropoffCoords: {
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
    carpoolStartTime: {
      type: Date, // <-- Use Date type here
      required: true,
    },
    carpoolDate: {
      type: Date,
      required: true,
    },
    riderIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ["no-match", "matched", "completed", "cancelled"],
      default: "no-match",
    },
    estimatedPrice: {
      type: Number,
      required: true,
    },
    carpoolDurationText: {
      type: String,
      required: false,
    },
    carpoolDistanceText: {
      type: String,
      required: false,
    },
    passengersCount: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial indexes for location queries
rideSchema.index({ carpoolPickupCoords: "2dsphere" });
rideSchema.index({ carpoolDropoffCoords: "2dsphere" });

const CarpoolRide = mongoose.model("CarpoolRide", rideSchema);

module.exports = CarpoolRide;
