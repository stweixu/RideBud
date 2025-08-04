// src/contexts/AuthContext.js
//bugfixed
import { createContext, useContext } from "react";

// Create an AuthContext
export const AuthContext = createContext();

// Custom hook to use AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};
