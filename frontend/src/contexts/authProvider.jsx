// src/contexts/AuthProvider.js
import React, { useEffect, useState } from "react";
import { AuthContext } from "./authContext"; // Import the context
import { fetchUserData } from "../utils/api";

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Wait until we check auth
  const [user, setUser] = useState(null); // Store user data

  const login = async () => {
    setIsAuthenticated(true); // Login logic

    try {
      const userData = await fetchUserData(); // Fetch user data after login
      setUser(userData); // Set user data to state
    } catch (err) {
      console.error("Error fetching user data:", err);
      setUser(null); // Handle error
    }
  };

  const logout = async () => {
    await fetch("http://localhost:5000/api/logout", {
      method: "POST",
      credentials: "include",
    });
    setIsAuthenticated(false);
    setUser(null); // Clear user data
  };

  useEffect(() => {
    // Simulate an API call to check authentication status
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth-check", {
          method: "GET",
          credentials: "include", // Include cookies in the request
        });

        const data = await res.json();
        setIsAuthenticated(data.isAuthenticated); // Set authentication status
        if (data.isAuthenticated) {
          const userData = await fetchUserData(); // Fetch user data after auth-check
          console.log("Fetched user data:", userData);
          setUser(userData); // Set user data to state
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthenticated(false); // Handle error
      } finally {
        setLoading(false); // Set loading to false after checking auth
      }
    };

    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
};
