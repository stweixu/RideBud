import React, { useEffect, useState } from "react";

const ConversationList = ({ onSelect, currentUserId }) => {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/chat/conversations", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setConversations(data))
      .catch((err) => console.error(err));
  }, []);

  // Helper function to format the time of the last message (e.g., "5:23 AM" or "Jul 26, 5:23 AM")
  const formatLastMessageTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error("Invalid date string for last message time:", dateString);
      return "Invalid Time";
    }
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      return (
        date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
        ", " +
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    }
  };

  // Helper function to format the carpool date and time (e.g., "Jul 29, 12:00 PM")
  const formatCarpoolDateTime = (isoDateString) => {
    if (!isoDateString) return "";
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) {
      console.error(
        "Invalid date string for carpool date/time:",
        isoDateString
      );
      return "Invalid Date/Time";
    }
    return (
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      ", " +
      date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  // Helper: Shorten location names by removing parentheses, but avoid aggressive word-based truncation
  const shortenLocationName = (locationName) => {
    if (!locationName) return "";
    let cleanedName = locationName.replace(/\s*\(.*\)\s*/g, "").trim();

    const words = cleanedName.split(" ");
    const maxWords = 5; // Allow up to 5 words before truncating
    if (words.length > maxWords) {
      return `${words.slice(0, maxWords).join(" ")}...`;
    }

    return cleanedName;
  };

  // NEW: Function to handle chat deletion
  const handleDeleteChat = async (conversationId, event) => {
    // Stop event propagation to prevent triggering the conversation selection
    event.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this conversation?")) {
      return; // User cancelled
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/chat/conversations/${conversationId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            // You might need to include authorization headers like 'Authorization: Bearer <token>'
            // if your backend requires it for delete operations.
          },
        }
      );

      if (response.ok) {
        // If deletion is successful, update the local state to remove the conversation
        setConversations((prevConversations) =>
          prevConversations.filter((conv) => conv._id !== conversationId)
        );
        // Optionally, if the deleted conversation was currently selected, deselect it
        // onSelect(null); // Or some default selection
        console.log(`Conversation ${conversationId} deleted successfully.`);
      } else {
        const errorData = await response.json();
        console.error(
          "Failed to delete conversation:",
          errorData.message || response.statusText
        );
        alert(`Error deleting chat: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Network error during chat deletion:", error);
      alert("Network error. Could not delete chat.");
    }
  };

  return (
    <div className="divide-y border rounded-md max-h-screen overflow-auto">
      {conversations.map((conv) => {
        const other = conv.participants.find((p) => p._id !== currentUserId);

        const displayOrigin = shortenLocationName(
          conv.userJourney?.journeyOrigin ||
            conv.carpoolRideId?.carpoolPickupLocation
        );
        const displayDestination = shortenLocationName(
          conv.userJourney?.journeyDestination ||
            conv.carpoolRideId?.carpoolDropoffLocation
        );

        const carpoolDateTime = conv.carpoolRideId?.carpoolStartTime;
        const lastMessageTimestamp = conv.lastMessage?.createdAt;

        return (
          <div
            key={conv._id}
            onClick={() => onSelect(conv._id)}
            className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer relative" // Added relative for positioning delete button
          >
            {/* Avatar */}
            <img
              src={other?.avatar || "/default-avatar.png"}
              alt={`${other?.displayName || "Unknown"} avatar`}
              className="w-10 h-10 rounded-full object-cover"
            />

            {/* Name, ride details, last message, and time */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <div className="font-semibold text-gray-800">
                  {other?.displayName || "Unknown"}
                </div>
              </div>

              {/* Display Ride Details (prioritize userJourney if available) */}
              {(displayOrigin || displayDestination) && carpoolDateTime && (
                <div className="text-xs text-gray-600 mb-1 leading-tight">
                  {displayOrigin && (
                    <span className="block font-normal text-green-700">
                      Origin: {displayOrigin}
                    </span>
                  )}
                  {displayDestination && (
                    <span className="block font-normal text-green-700">
                      Dest: {displayDestination}
                    </span>
                  )}
                  <span className="block text-green-700">
                    On {formatCarpoolDateTime(carpoolDateTime)}
                  </span>
                </div>
              )}
              <div className="flex items-end justify-between text-sm mt-auto">
                <div className="text-black truncate flex-grow mr-2">
                  {conv.lastMessage?.content || "No messages yet"}
                </div>
                {lastMessageTimestamp && (
                  <div className="text-xs text-gray-500 min-w-max flex-shrink-0">
                    {formatLastMessageTime(lastMessageTimestamp)}
                  </div>
                )}
              </div>
            </div>

            {/* NEW: Delete Chat Button */}
            <button
              onClick={(event) => handleDeleteChat(conv._id, event)}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100"
              title="Delete chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Optional: show unread count (positioned differently to not conflict with delete button) */}
            {conv.unreadCount > 0 && (
              <div className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs font-semibold">
                {conv.unreadCount}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;
