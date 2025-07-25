// socketHandler.js
const { Message, Conversation } = require("./models/ConversationAndMessage");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join conversation room
    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on("sendMessage", async (data) => {
      try {
        const { conversationId, senderId, receiverId, content } = data;

        const message = await Message.create({
          conversationId,
          senderId,
          receiverId,
          content,
          isRead: false,
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: {
            content,
            senderId,
            createdAt: new Date(),
          },
        });

        // Emit message to all clients in the conversation room
        io.to(conversationId).emit("newMessage", message);
      } catch (err) {
        console.error("Error sending message:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
