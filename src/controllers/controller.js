const bcrypt = require("bcrypt");
const Packaging = require("../models/packaging");
const User = require("../models/user");

async function getPackaging(req, res) {
  try {
    const packaging = await Packaging.find();
    return res.status(200).json({ message: "Success", data: packaging });
  } catch (err) {
    return res.status(500).json({
      message: "An error occurred while retrieving all products.",
      err,
    });
  }
}

async function registerUser(req, res) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

  const user = new User({
    username: req.body.username,
    password: hashedPassword,
  });

  await user.save();

  res.sendStatus(201).json({ message: "User created" });
}

async function signInUser(req, res) {
  const user = await User.findOne({ username: req.body.username });

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isValid = user.isValidPassword(req.body.password);

  if (!isValid) {
    return res.status(400).json({ message: "Invalid password" });
  }

  return res.status(200).json({ message: "Logged in successfully" });
}

module.exports = { getPackaging, registerUser, signInUser };
