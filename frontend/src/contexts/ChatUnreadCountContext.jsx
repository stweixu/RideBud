import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";

import { useAuth } from "./authContext";

// Create the context
const ChatUnreadCountContext = createContext(null);

// Create a provider component
export const ChatUnreadCountProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [loadingUnreadCount, setLoadingUnreadCount] = useState(true);
  const [errorUnreadCount, setErrorUnreadCount] = useState(null);

  // Function to fetch the unread count
  const fetchTotalUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setTotalUnreadCount(0);
      setLoadingUnreadCount(false);
      setErrorUnreadCount(null); // Clear any previous errors if logging out
      return; // Exit early if not authenticated
    }

    try {
      setLoadingUnreadCount(true);
      setErrorUnreadCount(null);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/chat/conversations/unread-total`,
        {
          credentials: "include", // Important for sending cookies/session
          // Add authorization header if your verifyToken middleware requires it (e.g., Bearer token)
          // headers: {
          //   'Authorization': `Bearer ${localStorage.getItem('token')}` // Example if using JWT
          // }
        }
      );

      if (!response.ok) {
        // Handle unauthorized or other errors gracefully
        if (response.status === 401 || response.status === 403) {
          console.warn(
            "User not authenticated or authorized to fetch unread count."
          );
          setTotalUnreadCount(0); // Set to 0 if not authenticated
        }
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch total unread count"
        );
      }

      const data = await response.json();
      setTotalUnreadCount(data.totalUnreadCount);
    } catch (err) {
      console.error("Error fetching total unread count:", err);
      setErrorUnreadCount(err.message);
      setTotalUnreadCount(0); // Reset to 0 on error
    } finally {
      setLoadingUnreadCount(false);
    }
  }, []); // No dependencies, so it's stable

  useEffect(() => {
    // Fetch initially
    fetchTotalUnreadCount();

    // Set up polling (e.g., every 10 seconds)
    const pollInterval = setInterval(fetchTotalUnreadCount, 10000); // Poll every 10 seconds

    // Clean up interval on component unmount
    return () => clearInterval(pollInterval);
  }, [fetchTotalUnreadCount]); // Re-run effect if fetchTotalUnreadCount changes (it won't because of useCallback)

  return (
    <ChatUnreadCountContext.Provider
      value={{
        totalUnreadCount,
        loadingUnreadCount,
        errorUnreadCount,
        refetchTotalUnreadCount: fetchTotalUnreadCount,
      }}
    >
      {children}
    </ChatUnreadCountContext.Provider>
  );
};

// Custom hook to use the context
export const useChatUnreadCount = () => {
  const context = useContext(ChatUnreadCountContext);
  if (context === undefined) {
    throw new Error(
      "useChatUnreadCount must be used within a ChatUnreadCountProvider"
    );
  }
  return context;
};
