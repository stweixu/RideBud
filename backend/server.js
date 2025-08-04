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
require("./services/googleStrategy");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_BASE_URL || "http://localhost:5173"],
    credentials: true,
  },
});

connectDB();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
      secure: process.env.NODE_ENV === "production", // true in prod if HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: [process.env.FRONTEND_BASE_URL || "http://localhost:5173"],
    credentials: true,
  })
);

app.use(cookieParser());

app.use("/api", require("./routes/apiRouter"));

// Pass the io instance to socket handler
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
