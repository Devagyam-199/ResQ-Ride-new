import User from "../Models/Users.models.js";

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

export default userNameGenerator;
