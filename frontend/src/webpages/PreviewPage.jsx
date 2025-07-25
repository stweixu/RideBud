import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/authContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

const ConversationList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/chat/conversations", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        setConversations(data.conversations || []);
      } catch (err) {
        console.error("Failed to load conversations:", err);
        setConversations([]);
      }
      setLoading(false);
    };

    fetchConversations();
  }, [user]);

  // Find the other participant in a conversation
  const getOtherParticipant = (participants) => {
    return participants.find((p) => p._id !== user._id) || {};
  };

  // Format date/time for last message
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    });
  };

  const handleConversationClick = (conversationId) => {
    // Navigate to chat page or open chat component
    navigate(`/chat/${conversationId}`);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading conversations...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No conversations found.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-4 space-y-3">
      {conversations.map((conv) => {
        const other = getOtherParticipant(conv.participants);
        return (
          <Card
            key={conv._id}
            className="cursor-pointer hover:bg-green-50"
            onClick={() => handleConversationClick(conv._id)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={other.avatar} alt={other.name} />
                <AvatarFallback>{other.name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{other.name || "Unknown"}</h4>
                  <span className="text-xs text-gray-400">
                    {formatTime(conv.lastMessage?.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate max-w-xs">
                  {conv.lastMessage?.content || "No messages yet"}
                </p>
              </div>
              <MessageCircle className="h-5 w-5 text-green-600" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ConversationList;
