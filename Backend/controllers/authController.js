const admin = require("../config/firebase");
const User = require("../models/User");

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

    res.json({
      message: "Login successful",
      user
    });
  } catch (error) {
    res.status(401).json({
      message: "Login failed",
      error: error.message
    });
  }
};

module.exports = {
  loginWithPhone
};