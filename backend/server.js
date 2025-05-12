const express = require("express");
const app = express();
const connectDB = require("./config/db");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const PORT = process.env.PORT || 5000;
const apiRouter = require("./routes/apiRouter"); // Import the API router

connectDB(); // Connect to MongoDB

app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true, // allow cookies to be sent
  })
);
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser());

app.use("/api", apiRouter); // All routes in apiRouter.js will be prefixed with /api

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
