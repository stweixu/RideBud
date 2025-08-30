const cron = require("node-cron");
const UserJourney = require("../models/UserJourney");
const CarpoolRide = require("../models/CarpoolRide");
const JourneyNavigation = require("../models/JourneyNavigation");

/**
 * Sets up the 10-minute cleanup cron.
 */
function setupCleanupCron() {
  cron.schedule("*/10 * * * *", async () => {
    console.log("[Cleanup] Running cleanup job...");
    const now = new Date();

    try {
      // 1. Expired pending journeys
      const expiredJourneys = await UserJourney.find({
        journeyTime: { $lt: now },
        status: "pending-selection",
      });

      for (const journey of expiredJourneys) {
        await CarpoolRide.deleteOne({ _id: journey.matchedRideId });
        await JourneyNavigation.deleteOne({ _id: journey.journeyNavigation });
        await UserJourney.deleteOne({ _id: journey._id });

        console.log(`🧹 Deleted expired journey: ${journey._id}`);
      }
    } catch (err) {
      console.error("❌ Error during 10-min cleanup:", err);
    }

    try {
      // 2. Completed matched journeys
      const passedMatchedJourneys = await UserJourney.find({
        journeyTime: { $lt: now },
        status: "matched",
      });

      for (const journey of passedMatchedJourneys) {
        await CarpoolRide.updateOne(
          { _id: journey.matchedRideId },
          { $set: { status: "completed" } }
        );
        await UserJourney.updateOne(
          { _id: journey._id },
          { $set: { status: "completed" } }
        );
        console.log(`🧹 Updated matched journey: ${journey._id}`);
      }
    } catch (err) {
      console.error("❌ Error during 10-min matched update:", err);
    }
  });

  console.log("✅ Cleanup cron scheduled (every 10 minutes).");
}

module.exports = { setupCleanupCron };
