const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const { getMessages } = require("../controllers/messageController");

router.get("/:conversationId", verifyToken, getMessages);

module.exports = router;