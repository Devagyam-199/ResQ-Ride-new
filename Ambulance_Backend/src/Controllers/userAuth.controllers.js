import verifyToken from "../services/msg91.services.js";
import User from "../Models/Users.models.js";
import jwtGen from "../Utils/jwtGenerator.utils.js";
import Driver from "../Models/Driver.models.js";

const userNameGenerator = async () => {
  let username;
  let notUnique = true;
  while (notUnique) {
    const randomNumGen = Math.floor(1000 + Math.random() * 9000);
    username = `user_${randomNumGen}`;

    const user = await User.findOne({
      userName: username,
    });

    if (!user) notUnique = false;
  }
  return username;
};

export const verifyTokenController = async (req, res) => {
  const { accessToken, role = "User" } = req.body;

  if (!accessToken) {
    return res.status(400).json({
      success: false,
      error: "accessToken from MSG91 widget is required",
    });
  }

  try {
    const mobile = await verifyToken(accessToken);

    const phone = `+${mobile}`;

    const existingDriver = await Driver.findOne({ phoneNumber: phone });
    if (existingDriver) {
      if (existingDriver.accStatus === "Pending")
        return res.status(403).json({
          success: false,
          error: "Your account is pending admin approval.",
        });
      if (existingDriver.accStatus === "Rejected")
        return res
          .status(403)
          .json({ success: false, error: "Your registration was rejected." });
      if (existingDriver.accStatus === "Suspended")
        return res
          .status(403)
          .json({ success: false, error: "Your account has been suspended." });
      const jwtToken = jwtGen(
        existingDriver._id,
        existingDriver.phoneNumber,
        "Driver",
      );
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
    const username = await userNameGenerator();
    if (!user)
      user = await User.create({
        phoneNumber: phone,
        role: "User",
        userName: username,
      });
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
    const user = await User.findById(req.user.userId).select("-__v");
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
