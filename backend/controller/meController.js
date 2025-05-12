const User = require("../models/User");

const meController = async (req, res) => {
    try {
        // Find the user by ID
        const user = await User.findById(req.user.userId).select("-password -__v");
    
        if (!user) {
        return res.status(404).json({ msg: "User not found" });
        }
    
        // Send the user data as a response
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
    }

    module.exports = { meController };