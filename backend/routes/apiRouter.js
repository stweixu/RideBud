const express = require("express");
const router = express.Router();

// Import individual route modules
const locationRouter = require("./locationRouter");
const registerRouter = require("./registerRouter");
const loginRouter = require("./loginRouter");

// Define the routeMap object to map paths to routers
const routeMap = {
  "/register": registerRouter,
  "/login": loginRouter,
  "/location": locationRouter,
};

// Dynamically use routes from the routeMap object
Object.entries(routeMap).forEach(([path, route]) => {
  router.use(path, route); // Dynamically adds each route to the router
});

module.exports = router; // Export the router to use in server.js
