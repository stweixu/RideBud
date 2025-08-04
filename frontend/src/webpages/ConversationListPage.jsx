import React, { useState, useEffect } from "react";
import ConversationList from "@/components/ConversationList";
import ChatBubble from "@/components/ChatBubble";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import BrandFooter from "@/components/BrandFooter";
import { ChevronLeft } from "lucide-react"; // Ensure this is imported for the ChatBubble back button

const ConversationListPage = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showConversationList, setShowConversationList] = useState(true);

  // Helper to determine if we are on a small screen (md breakpoint = 768px)
  const isMobile = () =>
    typeof window !== "undefined" && window.innerWidth < 768;

  // Effect to manage view state on conversation selection/deselection and window resize
  useEffect(() => {
    const updateViewBasedOnScreenSize = () => {
      if (selectedConversation && isMobile()) {
        setShowConversationList(false); // Hide list, show chat on mobile if conversation is selected
      } else {
        setShowConversationList(true); // Always show list by default on desktop or if no conversation selected on mobile
      }
    };

    // Initial check when component mounts or selectedConversation changes
    updateViewBasedOnScreenSize();

    // Add event listener for window resize to adjust view if breakpoint changes
    const handleResize = () => {
      // Re-evaluate the view state on resize
      updateViewBasedOnScreenSize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedConversation]); // Re-run when selectedConversation changes

  const handleSelectConversation = async (conversationId) => {
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/chat/conversation/${conversationId}`,
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

      // On mobile, after selecting a conversation, switch to chat view
      if (isMobile()) {
        setShowConversationList(false);
      }
    } catch (err) {
      console.error("Failed to fetch conversation:", err);
      // Reset state on error to prevent broken UI
      setSelectedConversation(null);
      setMessages([]);
      if (isMobile()) setShowConversationList(true); // Go back to list on error for mobile
    }
  };

  const handleBackToConversations = () => {
    setSelectedConversation(null); // Deselect conversation
    setMessages([]); // Clear messages
    setShowConversationList(true); // Show the conversation list again
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />
      {/* Main content area: now with max-width and centered */}
      <div className="flex flex-1 md:w-[70%] mx-auto p-4 gap-6">
        {/* Conversation List - Fixed width on desktop, full width on mobile if visible */}
        <div
          className={`w-full md:w-[200px] lg:w-[350px] bg-white rounded-lg shadow-md overflow-auto flex-shrink-0 ${
            showConversationList ? "block" : "hidden"
          } md:block`}
          // The ConversationList takes w-full on mobile when visible, and fixed width on desktop
          // Hidden on mobile if showConversationList is false
          // Always block on md and up (desktop)
        >
          <ConversationList
            onSelect={handleSelectConversation}
            currentUserId={user._id}
          />
        </div>

        {/* Chat Bubble / Placeholder - Takes remaining space, but with a refined max-width on desktop */}
        <div
          className={`flex-1 bg-white rounded-lg shadow-md flex flex-col h-full min-h-0 ${
            selectedConversation || (isMobile() && !showConversationList)
              ? "block w-full"
              : "hidden"
          } md:block md:max-w-md lg:max-w-lg`}
          // On mobile:
          //   - If selectedConversation is true OR (we're mobile AND showConversationList is false): block w-full
          //   - Else: hidden
          // On desktop (md:block):
          //   - Always block
          //   - flex-1: takes remaining space
          //   - md:max-w-md: caps its width at 448px from md breakpoint
          //   - lg:max-w-lg: caps its width at 512px from lg breakpoint
        >
          {selectedConversation ? (
            <ChatBubble
              inline={true} // Indicates it's embedded, not a floating dialog
              isOpen={true} // Always open when a conversation is selected
              setIsOpen={() => {}} // No external close needed when inline
              onBack={isMobile() ? handleBackToConversations : undefined} // Pass back handler only for mobile
              {...selectedConversation}
              messages={messages}
              setMessages={setMessages}
            />
          ) : (
            // Placeholder message when no conversation is selected
            <div
              className={`flex flex-1 items-center justify-center h-full text-gray-500 text-lg`}
            >
              <p className="text-center">
                Select a conversation to start chatting
              </p>
            </div>
          )}
        </div>
      </div>
      <BrandFooter /> {/* Renders the footer at the bottom of the page */}
    </div>
  );
};

export default ConversationListPage;
