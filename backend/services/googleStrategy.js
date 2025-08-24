// services/googleStrategy.js (updated)

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const cloudinary = require("../utility/cloudinary");
const axios = require("axios");
const streamifier = require("streamifier");

// Helper function for uploading to Cloudinary
function uploadImageFromURL(imageUrl, publicId) {
  return axios
    .get(imageUrl, { responseType: "arraybuffer" })
    .then((response) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "google_avatars",
            public_id: `google_avatars/${publicId}`,
            overwrite: true,
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error); // Add this line for debugging
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          }
        );
        streamifier.createReadStream(response.data).pipe(stream);
      });
    });
}

// 1. Register the strategy with Passport
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // 2. Use a full callback URL, this is safer
      callbackURL: `${process.env.API_BASE_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        let avatarUrl = null;

        if (profile.photos && profile.photos.length > 0) {
          try {
            avatarUrl = await uploadImageFromURL(
              profile.photos[0].value,
              profile.id
            );
          } catch (uploadError) {
            console.error(
              "Failed to upload avatar from Google profile:",
              uploadError
            );
            // Decide what to do here. You could use the Google URL directly or set avatarUrl to null.
            avatarUrl = profile.photos[0].value;
          }
        }

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            displayName: profile.displayName,
            avatar: avatarUrl,
          });
        } else {
          // You should add logic here to only update the avatar if it has changed
          if (user.avatar !== avatarUrl) {
            user.avatar = avatarUrl;
            await user.save();
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// 3. Add serialization/deserialization logic for session management
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
