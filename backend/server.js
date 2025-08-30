const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");

const connectDB = require("./config/db");
const socketHandler = require("./socketHandler");
require("./services/googleStrategy");

// Import the cron setup functions
const { setupCleanupCron } = require("./utility/cleanUpScheduler");
const { incrementDummyDatesCron } = require("./utility/dummyDataIncrementer");

const app = express();
const server = http.createServer(app);

// Trust proxy for secure cookies (Render requirement)
app.set("trust proxy", 1);

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://ride-bud.vercel.app",
  "https://ride-bud-git-main-stweixus-projects.vercel.app",
];

// Connect to MongoDB
connectDB().then(() => {
  // Start the crons after DB is connected
  setupCleanupCron();
  incrementDummyDatesCron();
});

// Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      return callback(
        new Error(`CORS policy does not allow access from ${origin}`),
        false
      );
    },
    credentials: true,
  })
);

// Handle preflight requests globally
app.options("*", cors({ origin: allowedOrigins, credentials: true }));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true, // Required for secure cookies behind proxy
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_ONLINE_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: "None",
      httpOnly: true,
    },
  })
);

app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api", require("./routes/apiRouter"));

// WebSocket setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      callback(new Error("CORS not allowed"), false);
    },
    credentials: true,
  },
});
socketHandler(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
