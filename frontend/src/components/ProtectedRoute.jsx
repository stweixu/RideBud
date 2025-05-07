// ProtectedRoute.jsx

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";

// A simple ProtectedRoute component that wraps around the element to protect
const ProtectedRoute = ({ element, ...rest }) => {
  const { isAuthenticated } = useAuth(); // Access the authentication status from AuthContext

  return isAuthenticated ? (
    element // If authenticated, render the component
  ) : (
    <Navigate to="/" /> // If not authenticated, redirect to login page
  );
};

export default ProtectedRoute;
