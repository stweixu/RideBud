const logOutController = async (req, res) => {
  try {
    // Clear the cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      path: "/",
    });

    res.status(200).json({ msg: "Logout successful" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
}

module.exports = { logOutController };