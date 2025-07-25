const cron = require("node-cron");
const UserJourney = require("../models/UserJourney");
const CarpoolRide = require("../models/CarpoolRide");
const JourneyNavigation = require("../models/JourneyNavigation");

// Run every 10 minutes
cron.schedule("*/10 * * * *", async () => {
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
      await CarpoolRide.deleteMany({ _id: journey.matchedRideId });

      // 3. Delete associated navigation entries
      await JourneyNavigation.deleteMany({ _id: journey.journeyNavigation });

      // 4. Delete the expired journey itself
      await UserJourney.deleteOne({ _id: journeyId });

      console.log(`🧹 Deleted expired journey: ${journeyId}`);
    }
  } catch (err) {
    console.error("❌ Error during cleanup:", err);
  }
});
