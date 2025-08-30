// models/UpdateTracker.js
const mongoose = require("mongoose");

const updateTrackerSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  lastRun: { type: Date, required: true },
});

module.exports = mongoose.model("UpdateTracker", updateTrackerSchema);
