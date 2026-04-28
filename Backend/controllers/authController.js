const admin = require("../config/firebase");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const createToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// First-time login / OTP verification
const loginWithPhone = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ message: "Firebase token is required" });
    }

    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

    const firebaseUid = decodedToken.uid;
    const phoneNumber = decodedToken.phone_number;

    let user = await User.findOne({ firebaseUid });

    if (!user) {
      user = await User.create({
        firebaseUid,
        phoneNumber
      });
    }

    const token = createToken(user);

    res.json({
      message: "Phone verified successfully",
      token,
      user
    });
  } catch (error) {
    res.status(401).json({
      message: "Phone verification failed",
      error: error.message
    });
  }
};

// Set password after OTP verification
const setPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    req.user.password = hashedPassword;
    req.user.hasPassword = true;

    await req.user.save();

    res.json({
      message: "Password saved successfully",
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save password",
      error: error.message
    });
  }
};

// Normal login after password is created
const loginWithPassword = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ message: "Phone number and password are required" });
    }

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: "User not found. Verify phone number first." });
    }

    if (!user.hasPassword || !user.password) {
      return res.status(400).json({ message: "Password is not set. Verify phone number first." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = createToken(user);

    res.json({
      message: "Login successful",
      token,
      user
    });
  } catch (error) {
    res.status(500).json({
      message: "Password login failed",
      error: error.message
    });
  }
};

module.exports = {
  loginWithPhone,
  setPassword,
  loginWithPassword
};