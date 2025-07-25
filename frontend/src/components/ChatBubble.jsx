// components/ChatBubble.jsx
import React, { useState, useEffect, useRef, useCallback } from "react"; // <-- ADD useCallback here
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
import { Send, X } from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import socket from "@/utils/socket";

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
}) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const currentUserId = user ? user._id : null;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket connected with id:", socket.id);
    });
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });
  }, []);

  useEffect(() => {
    if (conversationId && socket.connected) {
      socket.emit("joinConversation", conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    if (socket.connected) {
      socket.emit("joinConversation", conversationId);
    } else {
      socket.once("connect", () => {
        socket.emit("joinConversation", conversationId);
      });
    }

    return () => {
      if (socket.connected) {
        socket.emit("leaveConversation", conversationId);
      }
    };
  }, [conversationId]);

  const handleSendMessage = () => {
    if (message.trim() && receiverId) {
      socket.emit("sendMessage", {
        conversationId,
        senderId: currentUserId,
        receiverId,
        content: message.trim(),
      });
      setMessage("");
    }
  };

  // 1. Use useCallback to memoize handleNewMessage
  const handleNewMessage = useCallback(
    (newMsg) => {
      // Optional: Add a console.log here to confirm setMessages is a function
      // console.log("handleNewMessage triggered. Type of setMessages:", typeof setMessages);

      // This check is good for debugging but should ideally not be needed with useCallback
      if (typeof setMessages !== "function") {
        console.error("DEBUG: setMessages is unexpectedly not a function!", {
          newMsg,
          type: typeof setMessages,
          value: setMessages,
        });
        return; // Prevent crash
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
    [setMessages, currentUserId, user, receiverName, receiverAvatar]
  ); // <-- Dependencies for useCallback

  // 2. Modify this useEffect to depend on the memoized handleNewMessage
  useEffect(() => {
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [handleNewMessage]); // <-- CRUCIAL: Only depend on handleNewMessage now

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

  const ChatContent = (
    <div
      className={`flex flex-col ${
        inline ? "h-[80vh]" : "h-full"
      } min-h-0 rounded-lg shadow-md border border-gray-300 bg-white`}
    >
      {/* Header */}
      <div className="p-4 pb-2 border-b bg-green-600 text-white rounded-t-lg flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {receiverAvatar && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={receiverAvatar} alt={receiverName} />
              <AvatarFallback>{receiverName?.charAt(0) || ""}</AvatarFallback>
            </Avatar>
          )}
          <h2 className="text-white text-lg">
            {receiverName ? `Chat with ${receiverName}` : "Ridebud Chat"}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-green-700 h-8 w-8 p-0"
          aria-label="Close chat"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

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

      {/* Messages list - MODIFIED: Added max-h-[70vh] (example) and removed flex-1 */}
      {/* You can adjust max-h-[70vh] to suit your layout.
          h-[50vh] would be a fixed 50% of viewport height.
          max-h-[500px] would be a fixed pixel height. */}
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
    return ChatContent; // Keep this as is for inline mode
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="w-[80%] sm:max-w-md h-[500px] flex flex-col p-0 [&>button]:hidden overflow-hidden gap-0"
        // Keep your existing onPointerDownOutside and onInteractOutside
        onPointerDownOutside={(e) => {
          e.preventDefault();
          setIsOpen(false);
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
          setIsOpen(false);
        }}
      >
        {/* START OF THE CORRECTED HEADER STRUCTURE */}

        {/* DialogHeader provides the correct ARIA roles for the dialog.
            Apply background, padding, rounding directly to DialogHeader. */}
        <DialogHeader className="p-4 pb-2 bg-green-600 text-white rounded-t-lg flex-shrink-0">
          {/* This inner div now handles the flex layout (items-center, justify-between)
              between the title/avatar group and the close button. */}
          <div className="flex items-center justify-between w-full">
            {/* Group for Avatar and Title */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {receiverAvatar && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={receiverAvatar} alt={receiverName} />
                  <AvatarFallback>
                    {receiverName?.charAt(0) || ""}
                  </AvatarFallback>
                </Avatar>
              )}
              {/* DialogTitle for accessibility. Added 'truncate' to prevent long names from overflowing. */}
              <DialogTitle className="text-white text-lg m-0 leading-none truncate">
                {receiverName ? `Chat with ${receiverName}` : "Ridebud Chat"}
              </DialogTitle>
            </div>
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-green-700 h-8 w-8 p-0 flex-shrink-0"
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* DialogDescription: This is still important for accessibility, even if visually hidden. */}
        <DialogDescription className="sr-only ">
          {receiverId && rideDate && rideTime && rideOrigin && rideDestination
            ? `Conversation about carpool on ${formatDisplayDate(
                rideDate
              )}, ${rideTime} from ${rideOrigin} to ${rideDestination}.`
            : "This is a chat dialog."}
        </DialogDescription>

        {/* END OF THE CORRECTED HEADER STRUCTURE */}

        {/* Your existing Ride Details section - now outside of the DialogHeader */}
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

        {/* Your existing Messages list */}
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

        {/* Your existing Input and send section */}
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
      </DialogContent>
    </Dialog>
  );
};

export default ChatBubble;
