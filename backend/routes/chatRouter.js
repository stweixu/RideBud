const express = require("express");
const router = express.Router();
const {
  getOrCreateConversation,
  getUserConversations,
  sendMessage,
  getUnreadCount,
  getConversationByConversationId,
  deleteConversation, // Make sure this is imported
  getUnreadCountByUserId, // Make sure this is imported
} = require("../controller/conversationController");
const { verifyToken } = require("../middleware/authMiddleware"); // your auth middleware

// Get or create a conversation and fetch messages
router.post("/conversation", verifyToken, getOrCreateConversation);

// Get all conversations for the logged-in user with last message & unread count
router.get("/conversations", verifyToken, getUserConversations);

router.get(
  "/conversation/:conversationId",
  verifyToken,
  getConversationByConversationId
);

// Send a new message in a conversation
router.post("/message", verifyToken, sendMessage);

// Get unread message count for a specific conversation
router.get("/conversation:conversationId/unread", verifyToken, getUnreadCount);

// NEW: Route to delete a conversation
router.delete(
  "/conversations/:conversationId",
  verifyToken,
  deleteConversation
); // <-- Corrected this line

// NEW: Route to get total unread message count for the logged-in user
router.get("/conversations/unread-total", verifyToken, getUnreadCountByUserId); // <-- Added this new route

module.exports = router;
