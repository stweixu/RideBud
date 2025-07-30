//api.js

export const fetchUserData = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/me`, {
      method: "GET",
      credentials: "include", // Include cookies in the request
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};
