const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const gravatar = require("gravatar");
const Jimp = require("jimp");
const fs = require("fs/promises");
const { nanoid } = require("nanoid");
const { HttpError, sendEmail } = require("../helpers/index");
const { ctrlWrapper } = require("../decorators/index");
const User = require("../models/users");
const { json } = require("express");
require("dotenv/config");

const { SENDGRID_API_EMAIL } = process.env;

const posterPath = path.resolve("public", "avatars");

const register = async (req, res) => {
  const { email, password } = req.body;
  const avatarURL = gravatar.url(email, { protocol: "https" });
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email in use");
  }
  const hashPassword = await bcrypt.hash(password, 10);
  const verificationToken = nanoid();

  const newUser = await User.create({
    ...req.body,
    avatarURL,
    password: hashPassword,
    verificationToken,
  });

  const data = {
    to: email,
    from: SENDGRID_API_EMAIL,
    subject: "Verify your email",
    html: `<a target="_blank" href="http://localhost:3000/api/users/verify/${verificationToken}">Click to verify your email</a>`,
  };

  await sendEmail(data);

  res.status(201).json({
    user: {
      email,
      subscription: newUser.subscription,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

  if (!user.verify) {
    throw HttpError(404, "User not found. Email not verify.");
  }

  const userCompare = await bcrypt.compare(password, user.password);
  if (!userCompare) {
    throw HttpError(401, "Email or password is wrong");
  }
  const { id } = user;
  const payload = {
    id,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "23h" });
  await User.findByIdAndUpdate(id, { token });

  res.json({
    token,
    user: {
      email,
      subscription: user.subscription,
    },
  });
};

const verify = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });
  if (!user) {
    throw HttpError(404);
  }
  const { id } = user;
  await User.findByIdAndUpdate(id, {
    verify: true,
    verificationToken: null,
  });
  res.json({
    message: "Verification successful",
  });
};

const getCurrent = (req, res) => {
  const { email, subscription } = req.user;
  res.json({
    email,
    subscription,
  });
};

const logout = async (req, res) => {
  const { id } = req.user;
  await User.findByIdAndUpdate(id, { token: "" });
  res.status(204).json({
    message: "No content",
  });
};

const updateAvatar = async (req, res) => {
  const { path: oldpath, filename } = req.file;
  const { id } = req.user;
  const newpath = path.join(posterPath, filename);
  const avatarURL = path.join("avatars", filename);
  try {
    const image = await Jimp.read(oldpath);
    await image.resize(250, 250);
    await image.writeAsync(oldpath);
    await fs.rename(oldpath, newpath);
  } catch (error) {
    await fs.unlink(oldpath);
    throw HttpError(400, "Incorrect file format");
  }
  await User.findByIdAndUpdate(id, { avatarURL });
  res.status(200).json({ avatarURL });
};

const emailResend = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(404);
  }
  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }
  const data = {
    to: email,
    from: SENDGRID_API_EMAIL,
    subject: "Verify your email",
    html: `<a target="_blank" href="http://localhost:3000/api/users/verify/${user.verificationToken}">Click to verify your email</a>`,
  };
  await sendEmail(data);

  res.json({
    message: "Verification email sent",
  });
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  verify: ctrlWrapper(verify),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateAvatar: ctrlWrapper(updateAvatar),
  emailResend: ctrlWrapper(emailResend),
};
