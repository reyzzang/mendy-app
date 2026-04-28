const Conversation = require("../models/Conversation");

const createOrGetConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    let conversation = await Conversation.findOne({
      members: { $all: [req.user._id, receiverId] }
    }).populate("members", "username displayName");

    if (!conversation) {
      conversation = await Conversation.create({
        members: [req.user._id, receiverId]
      });

      conversation = await conversation.populate("members", "username displayName");
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create or get conversation",
      error: error.message
    });
  }
};

const getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: req.user._id
    })
      .populate("members", "username displayName")
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get conversations",
      error: error.message
    });
  }
};

module.exports = {
  createOrGetConversation,
  getMyConversations
};