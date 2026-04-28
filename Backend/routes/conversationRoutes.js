const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const {
  createOrGetConversation,
  getMyConversations
} = require("../controllers/conversationController");

router.post("/", verifyToken, createOrGetConversation);
router.get("/", verifyToken, getMyConversations);

module.exports = router;