import React, { useState, useEffect } from "react";
import ConversationList from "@/components/ConversationList";
import ChatBubble from "@/components/ChatBubble";
import { useAuth } from "@/contexts/authContext";
import Navbar from "@/components/Navbar";

const ConversationListPage = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const handleSelectConversation = async (conversationId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/chat/conversation/${conversationId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await res.json();

      const { conversation, messages, otherParticipant } = data;
      const ride = conversation.carpoolRideId || {};

      const formattedDate = ride.carpoolDate
        ? new Date(ride.carpoolDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "";

      const formattedTime = ride.carpoolStartTime
        ? new Date(ride.carpoolStartTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

      setSelectedConversation({
        conversationId,
        receiverId: otherParticipant._id,
        receiverName: otherParticipant.displayName,
        receiverAvatar: otherParticipant.avatar,
        rideDate: formattedDate,
        rideTime: formattedTime,
        rideOrigin: ride.carpoolPickupLocation,
        rideDestination: ride.carpoolDropoffLocation,
      });

      // Format messages for UI
      const formattedMessages = messages.map((msg) => ({
        id: msg._id,
        sender:
          msg.senderId.toString() === user._id.toString()
            ? "You"
            : otherParticipant.displayName,
        avatar:
          msg.senderId.toString() === user._id.toString()
            ? user.avatar
            : otherParticipant.avatar,
        message: msg.content,
        time: new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isMe: msg.senderId.toString() === user._id.toString(),
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error("Failed to fetch conversation:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1 md:w-[70%] mx-auto p-4 gap-6">
        <div className="w-1/3 bg-white rounded-lg shadow-md overflow-auto">
          <ConversationList
            onSelect={handleSelectConversation}
            currentUserId={user._id}
          />
        </div>

        <div className="flex-1 bg-white rounded-lg shadow-md flex flex-col h-full min-h-0">
          {selectedConversation ? (
            <ChatBubble
              inline={true}
              isOpen={true}
              setIsOpen={() => setSelectedConversation(null)}
              {...selectedConversation}
              messages={messages}
              setMessages={setMessages}
            />
          ) : (
            <div className="flex items-center justify-center flex-grow text-gray-500 text-lg">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationListPage;
