// apiRouter.js

const express = require("express");
const router = express.Router();

// Import individual route modules
const locationRouter = require("./locationRouter");
const registerRouter = require("./account-creation/registerRouter");
const loginRouter = require("./session-management/loginRouter");
const logOutRouter = require("./session-management/logOutRouter");
const authCheckRouter = require("./session-management/authCheckRouter");
const meRouter = require("./user-profile/meRouter");
const verifyEmailRouter = require("./account-creation/verifyEmailRouter");
const updateProfileRouter = require("./user-profile/updateProfileRouter");

// Define the routeMap object to map paths to routers
const routeMap = {
  "/register": registerRouter,
  "/login": loginRouter,
  "/location": locationRouter,
  "/logout": logOutRouter,
  "/auth-check": authCheckRouter,
  "/me": meRouter,
  "/verify": verifyEmailRouter,
  "/update-profile": updateProfileRouter,
};

// Dynamically use routes from the routeMap object
Object.entries(routeMap).forEach(([path, route]) => {
  router.use(path, route); // Dynamically adds each route to the router
});

module.exports = router; // Export the router to use in server.js
