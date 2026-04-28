const express = require("express");
const router = express.Router();

const { loginWithPhone } = require("../controllers/authController");

router.post("/login", loginWithPhone);

module.exports = router;