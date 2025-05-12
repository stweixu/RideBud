import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

const UserHomePage = () => {

  const { user, logout } = useAuth(); // Access the logout function from the auth context
  const Navigate = useNavigate(); // Initialize useNavigate for navigation

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      // Call the logout function from context (this will also hit the /api/logout endpoint)
      await logout(); 
      Navigate("/login"); // Navigate to login page after logout
    } catch (error) {
      console.error("Logout failed:", error); // Handle error if logout fails
    }
  };


  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <h1 className="app-title">MyApp</h1>
        <div>
          <Link to="/profile">
            <button className="button">Profile</button>
          </Link>
            <button
              className="button logout-button"
              onClick={handleLogout} // Call handleLogout on button click
            >
              Logout
            </button>
        </div>
      </nav>

      {/* Home Page Content */}
      <div className="home-content">
        <h1 className="welcome-title">Welcome to the Home Page!</h1>
        <p>Welcome {user ? user.displayName : "User"}.</p>
      </div>

      {/* Inline styles at the bottom */}
      <style>
        {`
          .navbar {
            padding: 16px;
            background-color: #38B2AC;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .app-title {
            font-size: 24px;
          }

          .button {
            background-color: transparent;
            color: white;
            border: 1px solid #38B2AC;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          }

          .logout-button {
            margin-left: 16px;
          }

          .home-content {
            padding: 32px;
          }

          .welcome-title {
            font-size: 36px;
            margin-bottom: 16px;
          }
        `}
      </style>
    </div>
  );
};

export default UserHomePage;
