// components/ChatBubble.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, X, ChevronLeft } from "lucide-react"; // Import ChevronLeft
import { useAuth } from "@/contexts/authContext";
import socket from "@/utils/socket";
import { cn } from "@/lib/utils"; // Make sure you have cn from shadcn/ui utils

const ChatBubble = ({
  inline = false,
  isOpen,
  setIsOpen,
  receiverName,
  receiverAvatar,
  receiverId,
  messages = [],
  setMessages,
  rideDate,
  rideTime,
  rideOrigin,
  rideDestination,
  conversationId,
  onBack, // <-- ACCEPT onBack PROP
}) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const currentUserId = user ? user._id : null;

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Socket connection and joining conversation
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log("Socket connected with id:", socket.id);
      if (conversationId) {
        socket.emit("joinConversation", conversationId);
      }
    };

    const handleConnectError = (err) => {
      console.error("Socket connection error:", err);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);

    // Initial join if already connected
    if (socket.connected && conversationId) {
      socket.emit("joinConversation", conversationId);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      if (socket.connected && conversationId) {
        socket.emit("leaveConversation", conversationId);
      }
    };
  }, [conversationId]); // Re-run when conversationId changes

  const handleSendMessage = () => {
    if (message.trim() && receiverId && conversationId && currentUserId) {
      socket.emit("sendMessage", {
        conversationId,
        senderId: currentUserId,
        receiverId,
        content: message.trim(),
      });
      setMessage(""); // Clear input immediately
    }
  };

  // Memoized callback for new messages from socket
  const handleNewMessage = useCallback(
    (newMsg) => {
      // Ensure the message belongs to the currently active conversation
      if (newMsg.conversationId !== conversationId) {
        console.warn(
          "Received message for different conversation:",
          newMsg.conversationId,
          "current:",
          conversationId
        );
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: newMsg._id,
          sender: newMsg.senderId === currentUserId ? "You" : receiverName,
          avatar:
            newMsg.senderId === currentUserId ? user.avatar : receiverAvatar,
          message: newMsg.content,
          time: new Date(newMsg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isMe: newMsg.senderId === currentUserId,
        },
      ]);
    },
    [
      setMessages,
      currentUserId,
      user,
      receiverName,
      receiverAvatar,
      conversationId,
    ]
  ); // Include conversationId in dependencies

  // Socket listener for new messages
  useEffect(() => {
    socket.on("newMessage", handleNewMessage);
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [handleNewMessage]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Define the common header content for both inline and dialog modes
  const ChatHeaderContent = (
    <div className="flex items-center justify-between w-full">
      {/* Back Button (only for inline mode when onBack is provided) */}
      {inline && onBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-white hover:bg-green-700 h-8 w-8 p-0 flex-shrink-0 mr-2"
          aria-label="Back to conversations"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Avatar and Title Group */}
      <div className="flex items-center gap-2 flex-grow min-w-0">
        {" "}
        {/* Use flex-grow and min-w-0 to allow truncation */}
        {receiverAvatar && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={receiverAvatar} alt={receiverName} />
            <AvatarFallback>{receiverName?.charAt(0) || ""}</AvatarFallback>
          </Avatar>
        )}
        <h2 className="text-white text-lg m-0 leading-none truncate">
          {" "}
          {/* Added truncate */}
          {receiverName ? `Chat with ${receiverName}` : "Ridebud Chat"}
        </h2>
      </div>

      {/* Close Button (only for dialog mode) */}
      {!inline && (
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-green-700 h-8 w-8 p-0 flex-shrink-0 ml-2"
          aria-label="Close chat"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const ChatContent = (
    <div
      className={cn(
        "flex flex-col min-h-0 rounded-lg shadow-md border border-gray-300 bg-white",
        inline ? "h-full w-full" : "h-full" // Use h-full and w-full for inline, h-full for dialog
      )}
    >
      {/* Header for inline mode (flex-col, so header is first div) */}
      {inline && (
        <div className="p-4 pb-2 border-b bg-green-600 text-white rounded-t-lg flex-shrink-0">
          {ChatHeaderContent}
        </div>
      )}

      {/* Ride Details */}
      <div className="bg-green-600 px-4 py-1 border-green-600 text-green-100 text-sm m-0 flex-shrink-0">
        <p className="">
          {receiverId && rideDate && rideTime && rideOrigin && rideDestination
            ? `Carpool Date: ${formatDisplayDate(rideDate)}, ${rideTime}`
            : "Select a ridebud to chat with"}
        </p>
        <p>
          {rideOrigin} → {rideDestination}
        </p>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400">No messages yet</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.isMe ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={msg.avatar} alt={msg.sender} />
                <AvatarFallback className="text-xs">
                  {msg.sender.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div
                className={`flex flex-col max-w-[70%] ${
                  msg.isMe ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500 font-medium">
                    {msg.isMe ? "You" : msg.sender}
                  </span>
                  <span className="text-xs text-gray-400">{msg.time}</span>
                </div>
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    msg.isMe
                      ? "bg-green-600 text-white"
                      : "bg-white text-gray-800 border"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input and send */}
      <div className="p-4 border-t bg-white flex-shrink-0 max-h-16">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              receiverId ? "Type a message..." : "Select a ridebud to chat"
            }
            disabled={!receiverId}
            className="flex-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
            aria-label="Message input"
            autoFocus={inline ? true : isOpen}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || !receiverId}
            className="bg-green-600 hover:bg-green-700 px-3"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (inline) {
    return ChatContent;
  }

  // Dialog mode rendering
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="w-[80%] sm:max-w-md h-[500px] flex flex-col p-0 [&>button]:hidden overflow-hidden gap-0"
        onPointerDownOutside={(e) => {
          e.preventDefault();
          setIsOpen(false);
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
          setIsOpen(false);
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* DialogHeader provides the correct ARIA roles for the dialog. */}
        <DialogHeader className="p-4 pb-2 bg-green-600 text-white rounded-t-lg flex-shrink-0">
          {ChatHeaderContent} {/* Use the common header content here */}
        </DialogHeader>
        <DialogTitle className="sr-only">
          {receiverName ? `Chat with ${receiverName}` : "Ridebud Chat"}
        </DialogTitle>
        {/* DialogDescription for accessibility. */}
        <DialogDescription className="sr-only">
          {receiverId && rideDate && rideTime && rideOrigin && rideDestination
            ? `Conversation about carpool on ${formatDisplayDate(
                rideDate
              )}, ${rideTime} from ${rideOrigin} to ${rideDestination}.`
            : "This is a chat dialog."}
        </DialogDescription>
        {/* Render the rest of the chat content here */}
        {ChatContent.props.children.slice(1)}{" "}
        {/* Skip the inline header, render from Ride Details down */}
      </DialogContent>
    </Dialog>
  );
};

export default ChatBubble;
