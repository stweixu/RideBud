const logOutController = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      path: "/",
    });

    res.status(200).json({ msg: "Logout successful" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = { logOutController };
