const User = require("../models/User");
const CarpoolRide = require("../models/CarpoolRide");

const meController = async (req, res) => {
  try {
    // Find the user by ID
    const user = await User.findById(req.user.userId)
      .select("-password -__v")
      .lean();

    const totalRides = await CarpoolRide.countDocuments({
      riderIds: user._id,
      status: "completed",
    });

    user.totalRides = totalRides;

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Send the user data as a response
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = { meController };
