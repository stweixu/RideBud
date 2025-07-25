// components/ChatButtonWithDialog.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import ChatBubble from "@/components/ChatBubble";
import { useAuth } from "@/contexts/authContext"; // Assuming you have auth context

/**
 * A reusable component that renders a "Message" button.
 * When clicked, it fetches/creates a chat conversation and opens a ChatBubble dialog.
 *
 * @param {object} props - The component props.
 * @param {object} props.rideBuddy - Information about the chat recipient (e.g., { id, name, avatar }).
 * @param {string} props.carpoolRideId - The ID of the carpool ride to associate the conversation with.
 * @param {object} props.rideDetails - Details of the ride for the chat header (e.g., { date, time, origin, destination }).
 */
const OpenChatDialogButton = ({
  rideBuddy,
  carpoolRideId,
  rideDetails,
  className,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChatReceiver, setCurrentChatReceiver] = useState(null);
  const [currentRideDetails, setCurrentRideDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);

  const { user } = useAuth(); // Get current user from auth context

  const handleOpenChat = async (e) => {
    e.stopPropagation(); // Prevent parent card click from firing

    // Set receiver and ride details immediately for ChatBubble
    setCurrentChatReceiver(rideBuddy);
    setCurrentRideDetails(rideDetails);

    try {
      const res = await fetch("http://localhost:5000/api/chat/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carpoolRideId: carpoolRideId,
          ridebudUserId: rideBuddy.id, // Use rideBuddy.id as the recipient
        }),
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data.conversation) {
        setConversationId(data.conversation._id);

        // Map messages from backend format to frontend format
        const mappedMessages = data.messages.map((msg) => ({
          id: msg._id,
          sender: msg.senderId === user._id ? "You" : rideBuddy.name,
          avatar: msg.senderId === user._id ? user.avatar : rideBuddy.avatar,
          message: msg.content,
          time: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isMe: msg.senderId === user._id,
        }));

        setMessages(mappedMessages);
      } else {
        console.error(
          "Failed to fetch/create conversation:",
          data.message || "Unknown error"
        );
        setMessages([]);
        setConversationId(null);
        // Optionally, show a toast error here
      }
    } catch (error) {
      console.error("Network error fetching/creating conversation:", error);
      setMessages([]);
      setConversationId(null);
      // Optionally, show a toast error here
    }

    setIsChatOpen(true); // Open the chat dialog regardless of API success (it will show "No messages yet" if failed)
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={`${className}`}
        onClick={handleOpenChat}
      >
        <MessageCircle className="hidden md:block md:size-4" />
        Message
      </Button>

      <ChatBubble
        isOpen={isChatOpen} // This is correct, passing the state variable
        setIsOpen={setIsChatOpen} // <--- FIX IS HERE: Use the correct setter from useState
        receiverId={currentChatReceiver?.id || null}
        receiverName={currentChatReceiver?.name || null}
        receiverAvatar={currentChatReceiver?.avatar || null}
        rideDate={currentRideDetails?.date || null}
        rideTime={currentRideDetails?.time || null}
        rideOrigin={currentRideDetails?.origin || null}
        rideDestination={currentRideDetails?.destination || null}
        messages={messages}
        setMessages={setMessages}
        conversationId={conversationId}
      />
    </>
  );
};

export default OpenChatDialogButton;
