import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, X } from "lucide-react";

const ChatBubble = ({
  isOpen,
  setIsOpen,
  receiverName,
  receiverAvatar,
  receiverId,
  // NEW PROPS for ride details
  rideDate,
  rideTime,
  rideOrigin,
  rideDestination,
}) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // Mock data for individual chats (replace with API calls in a real app)
  const mockIndividualMessages = {
    "passenger-sarah-sm": [
      {
        id: 1,
        sender: "Sarah Smith",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
        message: "Hey! Are you picking up from the main entrance?",
        time: "08:15 AM",
        isMe: false,
      },
      {
        id: 2,
        sender: "You",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=you",
        message: "Yes, I'll be there a few minutes early.",
        time: "08:16 AM",
        isMe: true,
      },
    ],
    "passenger-mike-jo": [
      {
        id: 1,
        sender: "Mike Johnson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
        message: "Confirming for the ride this afternoon. See you!",
        time: "04:30 PM",
        isMe: false,
      },
      {
        id: 2,
        sender: "You",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=you",
        message: "Got it, looking forward to it!",
        time: "04:32 PM",
        isMe: true,
      },
    ],
    "passenger-emily-ch": [
      {
        id: 1,
        sender: "Emily Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
        message: "Just saying thanks for the ride last week!",
        time: "11:00 AM",
        isMe: false,
      },
    ],
    "passenger-david-wi": [
      {
        id: 1,
        sender: "David Wilson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
        message: "Headed out now. Be there in 5.",
        time: "12:55 PM",
        isMe: false,
      },
      {
        id: 2,
        sender: "You",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=you",
        message: "Sounds good, I'm ready!",
        time: "12:56 PM",
        isMe: true,
      },
    ],
    "buddy-sarah-sm": [
      // Added mock data for UpcomingRideCard's buddy
      {
        id: 1,
        sender: "Sarah Smith",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
        message: "Hi! Just confirming our ride for tomorrow. All good?",
        time: "09:00 AM",
        isMe: false,
      },
      {
        id: 2,
        sender: "You",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=you",
        message: "Yep, looking forward to it!",
        time: "09:01 AM",
        isMe: true,
      },
    ],
    "buddy-john-do": [
      // Added mock data for UpcomingRideCard's buddy
      {
        id: 1,
        sender: "John Doe",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
        message: "Is the pickup spot easy to find at the Library?",
        time: "09:30 AM",
        isMe: false,
      },
      {
        id: 2,
        sender: "You",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=you",
        message: "Yes, right by the main entrance. See you soon!",
        time: "09:35 AM",
        isMe: true,
      },
    ],
  };

  useEffect(() => {
    if (receiverId) {
      console.log(
        `Fetching messages for individual chat with: ${receiverName} (ID: ${receiverId})`
      );
      setMessages(mockIndividualMessages[receiverId] || []);
    } else {
      setMessages([
        {
          id: 1,
          sender: "System",
          avatar: "",
          message: "Select a ridebud from your rides to start a chat.",
          time: "Now",
          isMe: false,
        },
      ]);
    }
  }, [receiverId, receiverName]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: "You",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=you",
        message: message.trim(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isMe: true,
      };
      setMessages([...messages, newMessage]);
      setMessage("");

      console.log(
        `Sending message to ${receiverName} (ID: ${receiverId}): ${message.trim()}`
      );
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[80%] sm:max-w-md h-[500px] flex flex-col p-0 [&>button]:hidden">
          <DialogHeader className="p-4 pb-2 border-b bg-green-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              {/* Display Avatar and Name */}
              <DialogTitle className="text-white flex items-center gap-2">
                {receiverAvatar && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={receiverAvatar} alt={receiverName} />
                    <AvatarFallback>
                      {receiverName?.charAt(0) || ""}
                    </AvatarFallback>
                  </Avatar>
                )}
                {receiverName ? `Chat with ${receiverName}` : "Ridebud Chat"}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-green-700 h-8 w-8 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* Display Scheduled Ride Details */}
            <p className="text-green-100 text-sm">
              {receiverId &&
              rideDate &&
              rideTime &&
              rideOrigin &&
              rideDestination
                ? `${formatDisplayDate(
                    rideDate
                  )}, ${rideTime}, ${rideOrigin} → ${rideDestination}`
                : "Select a ridebud to chat with"}
            </p>
          </DialogHeader>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
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
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  receiverId ? "Type a message..." : "Select a ridebud to chat"
                }
                disabled={!receiverId} // Disable input if no receiver is selected
                className="flex-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || !receiverId} // Disable send if no message or no receiver
                className="bg-green-600 hover:bg-green-700 px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatBubble;
