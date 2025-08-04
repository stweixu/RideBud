// utility/cleanUpScheduler.js

require("dotenv").config();
const mongoose = require("mongoose");
const cron = require("node-cron");

const UserJourney = require("../models/UserJourney");
const CarpoolRide = require("../models/CarpoolRide");
const JourneyNavigation = require("../models/JourneyNavigation");

// === Database Connection ===
const mongoURI = process.env.MONGO_ONLINE_URI;

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected successfully.");

    // Schedule cleanup every 10 minutes
    cron.schedule("*/10 * * * *", async () => {
      console.log("[Cleanup] Running cleanup job...");

      const now = new Date();

      try {
        // 1. Find expired pending journeys
        const expiredJourneys = await UserJourney.find({
          journeyTime: { $lt: now },
          status: "pending-selection",
        });

        for (const journey of expiredJourneys) {
          const journeyId = journey._id;

          // 2. Delete associated carpool rides
          await CarpoolRide.deleteOne({ _id: journey.matchedRideId });

          // 3. Delete associated navigation entries
          await JourneyNavigation.deleteOne({ _id: journey.journeyNavigation });

          // 4. Delete the expired journey itself
          await UserJourney.deleteOne({ _id: journeyId });

          console.log(`🧹 Deleted expired journey: ${journeyId}`);
        }
      } catch (err) {
        console.error("❌ Error during cleanup:", err);
      }

      try {
        const passedMatchedJourneys = await UserJourney.find({
          journeyTime: { $lt: now },
          status: "matched",
        });

        for (const journey of passedMatchedJourneys) {
          const journeyId = journey._id;

          // 2. Mark carpool ride as completed
          await CarpoolRide.updateOne(
            { _id: journey.matchedRideId },
            { $set: { status: "completed" } }
          );

          // 3. Mark journey as completed
          await UserJourney.updateOne(
            { _id: journeyId },
            { $set: { status: "completed" } }
          );

          console.log(`🧹 Updated matched journey: ${journeyId}`);
        }
      } catch (err) {
        console.error("❌ Error during cleanup:", err);
      }
    });

    // Schedule daily update at midnight
    cron.schedule("0 0 * * *", async () => {
      console.log("[Daily Update] Running daily update for 'no-match' journeys and rides...");

      try {
        // Update UserJourneys with status 'no-match' or 'matched'
        const noMatchJourneys = await UserJourney.find({
          status: { $in: ["no-match", "matched"] },
        });

        if (noMatchJourneys.length > 0) {
          console.log(
            `[Daily Update] Found ${noMatchJourneys.length} 'no-match'/'matched' journeys to update.`
          );

          for (const journey of noMatchJourneys) {
            const newDate = new Date(journey.preferredDateTime);
            newDate.setDate(newDate.getDate() + 1);
            journey.preferredDateTime = newDate;
            await journey.save();
          }
          console.log(
            `[Daily Update] Successfully updated ${noMatchJourneys.length} UserJourney documents.`
          );
        } else {
          console.log("[Daily Update] No 'no-match' UserJourney documents found.");
        }

        // Update CarpoolRides with status 'no-match'
        const noMatchRides = await CarpoolRide.find({ status: "no-match" });

        if (noMatchRides.length > 0) {
          console.log(`[Daily Update] Found ${noMatchRides.length} 'no-match' rides to update.`);

          for (const ride of noMatchRides) {
            const newDate = new Date(ride.carpoolDate);
            newDate.setDate(newDate.getDate() + 1);
            ride.carpoolDate = newDate;
            await ride.save();
          }
          console.log(
            `[Daily Update] Successfully updated ${noMatchRides.length} CarpoolRide documents.`
          );
        } else {
          console.log("[Daily Update] No 'no-match' CarpoolRide documents found.");
        }
      } catch (error) {
        console.error("❌ Error during daily update:", error);
      }
    });

    console.log("✅ All cron jobs scheduled and running...");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
