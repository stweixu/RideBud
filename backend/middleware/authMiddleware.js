const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
  const token = req.cookies.token; // Get the token from cookies
  if (!token) {
    return res.status(200).json({ isAuthenticated: false, msg: "No token" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to the request object
    req.user = decoded;


    // Move on to the next middleware or route handler
    next();
  } catch (err) {
    res.status(200).json({ isAuthenticated: false, msg: "Invalid token" });
  }
};

module.exports = { verifyToken };
