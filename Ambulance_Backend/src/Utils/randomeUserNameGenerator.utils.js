import User from "../Models/Users.models.js";
const userNameGenerator = async () => {
  const MAX_ATTEMPTS = 10;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const suffix = Math.random().toString(16).slice(2, 10);
    const username = `user_${suffix}`;

    const existing = await User.findOne({ userName: username }).lean();
    if (!existing) return username;
  }

  return `user_${Date.now().toString(16)}`;
};

export default userNameGenerator;