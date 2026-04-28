const User = require("../models/User");

const setUsername = async (req, res) => {
  try {
    const { username, displayName } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const cleanUsername = username.toLowerCase().trim();

    if (cleanUsername.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    if (cleanUsername.includes(" ")) {
      return res.status(400).json({ message: "Username cannot contain spaces" });
    }

    const existingUser = await User.findOne({ username: cleanUsername });

    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    req.user.username = cleanUsername;
    req.user.displayName = displayName || cleanUsername;

    await req.user.save();

    res.json({
      message: "Username saved successfully",
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to set username",
      error: error.message
    });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ message: "Username search is required" });
    }

    const users = await User.find({
      username: { $regex: username, $options: "i" },
      _id: { $ne: req.user._id }
    }).select("username displayName");

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to search users",
      error: error.message
    });
  }
};

module.exports = {
  setUsername,
  searchUsers
};