const dotenv = require("dotenv");
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

module.exports = {
  MONGO_URI,
  GOOGLE_API_KEY,
};
