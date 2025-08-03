//services/googleStrategy.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_BASE_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value.toLowerCase();
        let user = await User.findOne({ email });

        if (user) {
          // User exists — update Google ID & avatar if needed
          let needsUpdate = false;

          if (!user.googleId) {
            user.googleId = profile.id;
            needsUpdate = true;
          }
          if (user.avatar !== profile.photos[0]?.value) {
            user.avatar = profile.photos[0]?.value || user.avatar;
            needsUpdate = true;
          }
          if (needsUpdate) {
            await user.save();
          }

          return done(null, user);
        } else {
          // Create new user with Google info
          const newUser = new User({
            googleId: profile.id,
            email,
            displayName: profile.displayName,
            avatar: profile.photos[0]?.value || undefined,
            dateOfBirth: null,
          });

          await newUser.save();
          done(null, newUser);
        }
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// Serialize & deserialize user for session support
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
