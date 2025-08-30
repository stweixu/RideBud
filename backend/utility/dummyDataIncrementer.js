const cron = require("node-cron");
const UserJourney = require("../models/UserJourney");
const CarpoolRide = require("../models/CarpoolRide");
const JourneyNavigation = require("../models/JourneyNavigation");
const UpdateTracker = require("../models/UpdateTracker");

/**
 * Increment all dummy dates by 1 day and schedule daily cron.
 */
async function incrementDummyDatesCron() {
  const incrementDates = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let tracker = await UpdateTracker.findOne({ key: "dummyDataIncrement" });
    if (tracker && tracker.lastRun >= today) {
      console.log("✅ Dummy data increment already ran today. Skipping.");
      return;
    }

    console.log("[Dummy Data] Incrementing all dates by 1 day...");

    try {
      // --- UserJourneys ---
      const journeys = await UserJourney.find({});
      for (const j of journeys) {
        j.preferredDateTime.setDate(j.preferredDateTime.getDate() + 1);
        await j.save();
      }
      console.log(
        `[Dummy Data] Updated ${journeys.length} UserJourney documents.`
      );

      // --- CarpoolRides ---
      const rides = await CarpoolRide.find({});
      for (const r of rides) {
        r.carpoolDate.setDate(r.carpoolDate.getDate() + 1);
        r.carpoolStartTime.setDate(r.carpoolStartTime.getDate() + 1);
        await r.save();
      }
      console.log(
        `[Dummy Data] Updated ${rides.length} CarpoolRide documents.`
      );

      // --- JourneyNavigations ---
      const navigations = await JourneyNavigation.find({});
      for (const n of navigations) {
        n.journeyDepartureTime.setDate(n.journeyDepartureTime.getDate() + 1);
        await n.save();
      }
      console.log(
        `[Dummy Data] Updated ${navigations.length} JourneyNavigation documents.`
      );

      // --- Update tracker ---
      if (!tracker) {
        tracker = new UpdateTracker({
          key: "dummyDataIncrement",
          lastRun: new Date(),
        });
      } else {
        tracker.lastRun = new Date();
      }
      await tracker.save();

      console.log("✅ Dummy data increment complete.");
    } catch (err) {
      console.error("❌ Error incrementing dummy data:", err);
    }
  };

  // Run immediately on startup
  await incrementDates();

  // Schedule cron to run daily at midnight
  cron.schedule("0 0 * * *", incrementDates);
  console.log("✅ Dummy data increment cron scheduled (daily at midnight).");
}

module.exports = { incrementDummyDatesCron };
