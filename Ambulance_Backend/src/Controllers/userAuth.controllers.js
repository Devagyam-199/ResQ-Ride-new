import verifyToken from "../services/msg91.services.js";
import User from "../Models/Users.models.js";
import jwtGen from "../Utils/jwtGenerator.utils.js";
import Driver from "../Models/Driver.models.js";
import userNameGenerator from "../Utils/randomeUserNameGenerator.utils.js";

export const verifyTokenController = async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({
      success: false,
      error: "accessToken from MSG91 widget is required",
    });
  }

  try {
    const mobile = await verifyToken(accessToken);
    const phone  = `+${mobile}`;

    const existingDriver = await Driver.findOne({ phoneNumber: phone });
    if (existingDriver) {
      if (existingDriver.accStatus === "Pending")
        return res.status(403).json({ success: false, error: "Your account is pending admin approval." });
      if (existingDriver.accStatus === "Rejected")
        return res.status(403).json({ success: false, error: "Your registration was rejected." });
      if (existingDriver.accStatus === "Suspended")
        return res.status(403).json({ success: false, error: "Your account has been suspended." });

      const jwtToken = jwtGen(existingDriver._id, existingDriver.phoneNumber, "Driver");
      return res.status(200).json({
        success: true,
        message: "Authenticated successfully",
        data: {
          accessToken: jwtToken,
          user: { ...existingDriver.toObject(), role: "Driver" },
        },
      });
    }

    let user = await User.findOne({ phoneNumber: phone });
    if (!user) {
      const username = await userNameGenerator();
      user = await User.create({ phoneNumber: phone, role: "User", userName: username });
    }

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    const jwtToken = jwtGen(user._id, user.phoneNumber, user.role);
    return res.status(200).json({
      success: true,
      message: "Authenticated successfully",
      data: { accessToken: jwtToken, user },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role === "Driver") {
      const driver = await Driver.findById(userId).select("-__v -password");
      if (!driver) return res.status(404).json({ success: false, error: "Driver not found" });
      return res.status(200).json({ success: true, user: { ...driver.toObject(), role: "Driver" } });
    }

    if (role === "Admin") {
      const admin = await User.findById(userId).select("-__v");
      if (!admin) return res.status(404).json({ success: false, error: "Admin not found" });
      return res.status(200).json({ success: true, user: admin });
    }

    const user = await User.findById(userId).select("-__v");
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};