import React from "react";
import { User, LogOut, Car } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext"; // Adjust path as needed

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const onProfileClick = (e) => {
    e.preventDefault();
    navigate("/profile");
  };

  const onMyRidesClick = (e) => {
    e.preventDefault();
    navigate("/my-rides");
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-16 bg-green-600 text-white shadow-md z-50">
      <div className="w-full h-full px-4 flex items-center justify-between">
        <Link className="flex items-center" to="/login">
          <Car className="h-8 w-15" />
          <h1>RideBud</h1>
        </Link>

        <div className="flex items-center">
          <button className="navbar-button" onClick={onProfileClick}>
            <User className="h-6 w-8" />
            Profile
          </button>

          <button className="navbar-button" onClick={onMyRidesClick}>
            <Car className="h-6 w-8" />
            My Rides
          </button>

          <button className="navbar-button" onClick={handleLogout}>
            <LogOut className="h-6 w-8" />
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
