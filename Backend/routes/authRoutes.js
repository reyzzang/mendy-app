const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const {
  loginWithPhone,
  setPassword,
  loginWithPassword
} = require("../controllers/authController");

router.post("/login", loginWithPhone);
router.post("/set-password", verifyToken, setPassword);
router.post("/password-login", loginWithPassword);

module.exports = router;