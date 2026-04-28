const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },

    displayName: {
      type: String,
      trim: true
    },

    firebaseUid: {
      type: String,
      required: true,
      unique: true
    },

    lastSeen: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);