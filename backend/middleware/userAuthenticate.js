const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const userAuth = (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to the request object
    req.user = decoded.userId;

    // Move on to the next middleware or route handler
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

module.exports = userAuth;
