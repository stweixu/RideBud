import React, { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext"; // Import the context
import { fetchUserData } from "../utils/api";

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Wait until we check auth
  const [user, setUser] = useState(null); // Store user data

  // New state for journeys reset by main rider
  const [resetJourneys, setResetJourneys] = useState([]);

  const fetchResetJourneys = async () => {
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/user-journeys/reset-by-main-rider`,
        {
          credentials: "include",
        }
      );
      if (res.ok) {
        const data = await res.json();
        setResetJourneys(data.affectedJourneys || []);
      } else {
        console.warn("Failed to fetch reset journeys");
        setResetJourneys([]);
      }
    } catch (error) {
      console.error("Error fetching reset journeys:", error);
      setResetJourneys([]);
    }
  };

  const login = async () => {
    setIsAuthenticated(true);

    try {
      const userData = await fetchUserData();
      setUser(userData);
      await fetchResetJourneys(); // Fetch reset journeys immediately after login
    } catch (err) {
      console.error("Error fetching user data:", err);
      setUser(null);
      setResetJourneys([]);
    }
  };

  const logout = async () => {
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    setIsAuthenticated(false);
    setUser(null);
    setResetJourneys([]);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/auth-check`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const data = await res.json();
        setIsAuthenticated(data.isAuthenticated);
        if (data.isAuthenticated) {
          const userData = await fetchUserData();
          setUser(userData);
          await fetchResetJourneys(); // Also fetch reset journeys after auth-check
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return <div></div>;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        user,
        setUser,
        resetJourneys, // Expose reset journeys here
        setResetJourneys,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
