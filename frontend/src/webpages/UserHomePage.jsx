import React from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../contexts/authContext";

const UserHomePage = () => {
  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <h1 className="app-title">MyApp</h1>
        <div>
          <Link to="/profile">
            <button className="button">Profile</button>
          </Link>
          <Link to="/">
            <button
              className="button logout-button"
              onClick={(e) => {
                e.preventDefault();
                localStorage.removeItem("token"); // Remove token from local storage
              }}
            >
              Logout
            </button>
          </Link>
        </div>
      </nav>

      {/* Home Page Content */}
      <div className="home-content">
        <h1 className="welcome-title">Welcome to the Home Page!</h1>
        <p>Your application is now live. Customize this page as you need.</p>
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
