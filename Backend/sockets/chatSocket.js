const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const onlineUsers = new Map();

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_user_room", (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.join(userId);
      console.log("User joined room:", userId);
    });

    socket.on("send_message", async (data) => {
      try {
        const { conversationId, senderId, receiverId, text } = data;

        if (!conversationId || !senderId || !receiverId || !text.trim()) {
          return;
        }

        const message = await Message.create({
          conversationId,
          senderId,
          receiverId,
          text
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: text,
          lastMessageAt: new Date()
        });

        io.to(receiverId).emit("receive_message", message);
        io.to(senderId).emit("receive_message", message);
      } catch (error) {
        console.error("Socket message error:", error.message);
      }
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }

      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = chatSocket;