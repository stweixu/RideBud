const mongoose = require("mongoose");
const connectDB = require("./config/db"); // Import your connectDB function
const User = require("./models/User"); // Assuming your User model is defined in models/User.js
require("dotenv").config();

// --- Configuration ---
// Default values to populate for existing users
const DEFAULT_DATE_OF_BIRTH = new Date("1990-01-01T00:00:00Z"); // A generic past date
const DEFAULT_RATING = 0; // Matches schema default
const DEFAULT_BIO = ""; // Matches schema default
// --- End Configuration ---

async function populateMissingUserFields() {
  try {
    // Connect to MongoDB using your existing connectDB function
    await connectDB();
    console.log("MongoDB connected via db.js for script execution.");

    // Find users that are missing the 'dateOfBirth' field
    const usersToUpdate = await User.find({
      $or: [
        { dateOfBirth: { $exists: false } }, // Does not exist
        { dateOfBirth: null }, // Exists but is null
      ],
    });

    if (usersToUpdate.length === 0) {
      console.log("No users found missing 'dateOfBirth'. No updates needed.");
      return;
    }

    console.log(`Found ${usersToUpdate.length} users to update.`);

    for (const user of usersToUpdate) {
      // Set default values if they are missing
      if (!user.dateOfBirth) {
        user.dateOfBirth = DEFAULT_DATE_OF_BIRTH;
      }
      if (user.rating === undefined || user.rating === null) {
        user.rating = DEFAULT_RATING;
      }
      if (user.bio === undefined || user.bio === null) {
        user.bio = DEFAULT_BIO;
      }

      // Save the updated user document
      await user.save();
      console.log(`Updated user: ${user.email} (ID: ${user._id})`);
    }

    console.log("All missing user fields populated successfully!");
  } catch (error) {
    console.error("Error populating user fields:", error);
  } finally {
    // Disconnect from MongoDB to ensure a clean exit for the script
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

// Run the script
populateMissingUserFields();
