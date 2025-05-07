import React, { useContext, createContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if the user is authenticated based on the cookie
    const authCookie = Cookies.get("isAuthenticated");
    if (authCookie === "true") {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const login = () => {
    // Set the cookie with an expiration (e.g., 1 day)
    Cookies.set("isAuthenticated", "true", { expires: 1 });
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Remove the cookie on logout
    Cookies.remove("isAuthenticated");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
