import React from "react";
import {
  Navigate,
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom"; // Import Routes instead of Switch
import { RegistrationPage, UserHomePage, LoginPage } from "./webpages"; // Import your pages
import { useAuth } from "./contexts/authContext"; // Import the useAuth hook
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute
import "font-awesome/css/font-awesome.min.css";

const App = () => {
  const { isAuthenticated } = useAuth(); // Access authentication status

  return (
    <Router>
      <div>
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/home" /> : <LoginPage />}
          />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/home" /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? <Navigate to="/home" /> : <RegistrationPage />
            }
          />

          <Route
            path="/home"
            element={
              <ProtectedRoute element={<UserHomePage />} /> // Protect the UserHomePage route
            }
          />

          {/* Fallback Route (Page not found) */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
