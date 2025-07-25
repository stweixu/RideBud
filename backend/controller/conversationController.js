// backend/controller/conversationController.js
const { Conversation, Message } = require("../models/ConversationAndMessage");
const UserJourney = require("../models/UserJourney");
const mongoose = require("mongoose");

// Create or get existing conversation
const getOrCreateConversation = async (req, res) => {
  const userId = req.user.userId;
  const { carpoolRideId, ridebudUserId } = req.body;

  const userIds = [userId, ridebudUserId];

  if (!userIds || userIds.length < 2 || !carpoolRideId) {
    return res
      .status(400)
      .json({ error: "userIds and carpoolRideId required" });
  }

  try {
    let conversation = await Conversation.findOne({
      participants: { $all: userIds, $size: userIds.length },
      carpoolRideId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: userIds,
        carpoolRideId,
      });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      {
        conversationId: conversation._id,
        receiverId: userId,
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      conversation,
      messages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get/create conversation" });
  }
};

// Fetch all conversations for current user with last message & unread count
const getUserConversations = async (req, res) => {
  const userId = req.user.userId;

  try {
    // 1. Find conversations where user is participant
    const conversations = await Conversation.find({
      participants: new mongoose.Types.ObjectId(userId),
    })
      .populate({
        path: "participants",
        select: "displayName avatar", // adjust to your User fields
      })
      .populate({
        path: "carpoolRideId", // This populates the CarpoolRide object
        select:
          "carpoolDate carpoolStartTime carpoolPickupLocation carpoolDropoffLocation",
      })
      .lean();

    // 2. For each conversation get last message, unread count, and USER JOURNEY details
    const conversationData = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({ conversationId: conv._id })
          .sort({ createdAt: -1 })
          .lean();

        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          receiverId: userId,
          isRead: false,
        });

        // Identify the other participant for 1:1 chat preview
        const otherParticipant = conv.participants.find(
          (p) => p._id.toString() !== userId
        );

        // --- NEW LOGIC: Fetch UserJourney for the current user and this specific carpool ride ---
        let userJourneyDetails = null;
        if (conv.carpoolRideId) {
          // Ensure a carpool ride is linked
          userJourneyDetails = await UserJourney.findOne({
            userId: new mongoose.Types.ObjectId(userId), // The logged-in user
            matchedRideId: conv.carpoolRideId._id, // The carpool ride associated with this conversation
          })
            .select("journeyOrigin journeyDestination") // Select only the fields you need
            .lean();
        }
        // --- END NEW LOGIC ---

        return {
          ...conv,
          otherParticipant,
          lastMessage,
          unreadCount,
          userJourney: userJourneyDetails, // Add the user's specific journey details to the response
        };
      })
    );

    res.status(200).json(conversationData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get conversations" });
  }
};

// Fetch a single conversation by ID with messages and participants populated
const getConversationByConversationId = async (req, res) => {
  const userId = req.user.userId;
  const { conversationId } = req.params;

  try {
    // Find the conversation and populate participants and journey info
    const conversation = await Conversation.findById(conversationId)
      .populate({
        path: "participants",
        select: "displayName avatar",
      })
      .populate({
        path: "carpoolRideId",
        select:
          "carpoolDate carpoolStartTime carpoolPickupLocation carpoolDropoffLocation",
      })
      .lean();

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Ensure the user is a participant of this conversation (authorization)
    if (!conversation.participants.some((p) => p._id.toString() === userId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this conversation" });
    }

    // Find the other participant (the one that is NOT the current user)
    const otherParticipant = conversation.participants.find(
      (p) => p._id.toString() !== userId
    );

    // --- NEW LOGIC: Fetch UserJourney for the current user for this specific carpool ride ---
    let userJourneyDetails = null;
    if (conversation.carpoolRideId) {
      userJourneyDetails = await UserJourney.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        matchedRideId: conversation.carpoolRideId._id,
      })
        .select("journeyOrigin journeyDestination")
        .lean();
    }
    // --- END NEW LOGIC ---

    // Get all messages for the conversation, sorted oldest to newest
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    // Mark unread messages for this user as read (optional)
    await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    // Return conversation details + messages + otherParticipant + userJourney
    res.status(200).json({
      conversation,
      messages,
      otherParticipant,
      userJourney: userJourneyDetails,
    });
  } catch (err) {
    console.error("getConversationById error:", err);
    res.status(500).json({ error: "Failed to get conversation" });
  }
};

// Send a new message
const sendMessage = async (req, res) => {
  const senderId = req.user.userId;

  const { conversationId, content } = req.body;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation)
    return res.status(404).json({ error: "Conversation not found" });

  const receiverId = conversation.participants.find(
    (id) => id.toString() !== senderId
  );

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Message content cannot be empty" });
  }

  if (!conversationId || !senderId || !receiverId) {
    return res.status(400).json({
      error: "conversationId, senderId, and receiverId required",
    });
  }

  try {
    const message = await Message.create({
      conversationId,
      receiverId,
      senderId,
      content,
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Delete a conversation and its messages
const deleteConversation = async (req, res) => {
  const userId = req.user.userId; // User performing the delete
  const { conversationId } = req.params;

  try {
    // 1. Find the conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // 2. Authorization Check: Ensure the user is a participant of this conversation
    if (!conversation.participants.some((p) => p.toString() === userId)) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this conversation" });
    }

    // 3. Delete all messages associated with this conversation
    await Message.deleteMany({ conversationId: conversation._id });
    console.log(`Deleted messages for conversation ${conversationId}`);

    // 4. Delete the conversation itself
    const result = await Conversation.findByIdAndDelete(conversationId);

    if (!result) {
      return res
        .status(404)
        .json({
          message: "Conversation not found after messages deleted (unlikely)",
        });
    }

    res
      .status(200)
      .json({
        message: "Conversation and associated messages deleted successfully",
        conversationId,
      });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res
      .status(500)
      .json({ message: "Server error during deletion", error: error.message });
  }
};

// NEW: Get total unread message count for the current user
const getUnreadCountByUserId = async (req, res) => {
  const userId = req.user.userId; // Assuming userId is available from authentication middleware

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const totalUnreadCount = await Message.countDocuments({
      receiverId: new mongoose.Types.ObjectId(userId), // Messages received by this user
      isRead: false, // That are not yet read
    });

    res.status(200).json({ totalUnreadCount });
  } catch (err) {
    console.error("Error getting total unread count:", err);
    res.status(500).json({ error: "Failed to get total unread count" });
  }
};

const getUnreadCount = async (req, res) => {
  const userId = req.user.userId;
  const { conversationId } = req.params;

  const count = await Message.countDocuments({
    conversationId,
    receiverId: userId,
    isRead: false,
  });

  res.status(200).json({ unreadCount: count });
};

module.exports = {
  getOrCreateConversation,
  getUserConversations,
  sendMessage,
  getUnreadCount,
  getConversationByConversationId,
  deleteConversation,
  getUnreadCountByUserId, // <-- Export the new function
};
