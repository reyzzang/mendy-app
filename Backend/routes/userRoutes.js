const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const { setUsername, searchUsers } = require("../controllers/userController");

router.post("/set-username", verifyToken, setUsername);
router.get("/search", verifyToken, searchUsers);

module.exports = router;