import React from "react";
import {
  Navigate,
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom"; // Import Routes instead of Switch
import {
  RegistrationPage,
  UserHomePage,
  LoginPage,
  PreviewPage,
} from "./webpages"; // Import your pages
import { useAuth } from "./contexts/authContext"; // Import the useAuth hook
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute
import "font-awesome/css/font-awesome.min.css";
import CreateRidePage from "./webpages/CreateRidePage"; // Import CreateRidePage

const App = () => {
  const { isAuthenticated } = useAuth(); // Access authentication status

  return (
    <Router>
      <div>
        <Routes>
          <Route
            path="/"
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/home" />}
          />
          <Route
            path="/login"
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/home" />}
          />
          <Route
            path="/register"
            element={
              !isAuthenticated ? <RegistrationPage /> : <Navigate to="/home" />
            }
          />

          <Route
            path="/home"
            element={
              <ProtectedRoute element={<UserHomePage />} /> // Protect the UserHomePage route by checking server authentication
            }
          />

          <Route
            path="/create-ride"
            element={
              <ProtectedRoute element={<CreateRidePage />} /> // Protect the UserHomePage route by checking server authentication
            }
          />

          <Route path="/preview" element={<PreviewPage />} />
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
