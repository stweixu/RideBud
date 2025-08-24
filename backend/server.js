const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const socketHandler = require("./socketHandler");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cron = require("node-cron");
require("./services/googleStrategy");
require("./utility/cleanUpScheduler");

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://ride-bud.vercel.app",
  "https://ride-510m73a1j-stweixus-projects.vercel.app",
  "https://ride-bud-git-main-stweixus-projects.vercel.app",
];

// Connect to MongoDB
connectDB();

// Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow non-browser requests
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

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_ONLINE_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS in production
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
    origin: function (origin, callback) {
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
