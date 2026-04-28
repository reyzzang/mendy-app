const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isMember = conversation.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not part of this conversation" });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get messages",
      error: error.message
    });
  }
};

module.exports = {
  getMessages
};