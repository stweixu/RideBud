// This script automatically updates the date fields for 'no-match' journeys and rides.
// It is designed to be run as a cron job, for example, once every 24 hours.
require("dotenv").config();
const mongoose = require("mongoose");
const cron = require("node-cron");

const UserJourney = require("../models/UserJourney");
const CarpoolRide = require("../models/CarpoolRide");

// === Database Connection ===
const mongoURI = process.env.MONGO_ONLINE_URI;

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected successfully."))
  .catch((err) => console.error("MongoDB connection error:", err));

// === Core Logic: The Update Function ===
/**
 * Finds and updates UserJourney and CarpoolRide documents with a 'no-match' status.
 * It increments their respective date fields by one day.
 */
async function updateNoMatchJourneysAndRides() {
  console.log("Starting daily update for 'no-match' journeys and rides...");

  try {
    // === Update UserJourneys ===
    // Find all journeys that have not been matched
    const noMatchJourneys = await UserJourney.find({
      status: { $in: ["no-match", "matched"] },
    });
    let updatedJourneysCount = 0;

    if (noMatchJourneys.length > 0) {
      console.log(
        `Found ${noMatchJourneys.length} 'no-match', "matched" journeys to update.`
      );

      for (const journey of noMatchJourneys) {
        // Create a new Date object based on the old date to avoid mutation
        const newDate = new Date(journey.preferredDateTime);
        newDate.setDate(newDate.getDate() + 1); // Increment by one day

        journey.preferredDateTime = newDate;
        await journey.save();
        updatedJourneysCount++;
      }
      console.log(
        `Successfully updated ${updatedJourneysCount} UserJourney documents.`
      );
    } else {
      console.log("No 'no-match' UserJourney documents found.");
    }

    // === Update CarpoolRides ===
    // Find all rides that have not been matched
    const noMatchRides = await CarpoolRide.find({ status: "no-match" });
    let updatedRidesCount = 0;

    if (noMatchRides.length > 0) {
      console.log(`Found ${noMatchRides.length} 'no-match' rides to update.`);

      for (const ride of noMatchRides) {
        // Create a new Date object based on the old date to avoid mutation
        const newDate = new Date(ride.carpoolDate);
        newDate.setDate(newDate.getDate() + 1); // Increment by one day

        ride.carpoolDate = newDate;
        await ride.save();
        updatedRidesCount++;
      }
      console.log(
        `Successfully updated ${updatedRidesCount} CarpoolRide documents.`
      );
    } else {
      console.log("No 'no-match' CarpoolRide documents found.");
    }
  } catch (error) {
    console.error("An error occurred during the daily update:", error);
  } finally {
    // This is useful if you want to close the connection after the script runs
    // but for a cron job, you might want to keep the connection open.
    // mongoose.disconnect();
    console.log("Daily update process finished.");
  }
}

// === Schedule the Cron Job ===
// The string '0 0 * * *' means "at 00:00 (midnight) every day".
// You can adjust this string to run at a different frequency.
// For example, '*/10 * * * *' would run every 10 minutes for testing.
cron.schedule("0 0 * * *", () => {
  updateNoMatchJourneysAndRides();
});

console.log("Daily update cron job scheduled to run at midnight.");
console.log("Script is running and awaiting the next scheduled execution.");
