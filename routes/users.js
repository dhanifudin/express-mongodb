const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const createError = require("http-errors");
const saltRounds = 10;

const User = require("../models/User");
const auth = require("../middleware/auth");
const { sendPasswordResetEmail } = require("../services/mailer");

const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret";
const JWT_EXPIRES_IN = "7d";

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw createError(400, "name, email, and password are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError(409, "This email is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const user = await User.create({ name, email, password: hashedPassword });

  res.status(201).json({ _id: user._id, name: user.name, email: user.email });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError(400, "email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw createError(401, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw createError(401, "Invalid email or password");
  }

  const token = jwt.sign({ sub: user._id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  res.json({ token, _id: user._id, name: user.name, email: user.email });
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ _id: user._id, name: user.name, email: user.email });
});

router.put("/me", auth, async (req, res) => {
  const { name, email } = req.body;

  if (email) {
    const conflict = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (conflict) {
      throw createError(409, "email is already in use");
    }
  }

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { ...(name && { name }), ...(email && { email }) },
    { new: true, runValidators: true }
  );

  res.json({ _id: updated._id, name: updated.name, email: updated.email });
});

router.put("/me/password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw createError(400, "currentPassword and newPassword are required");
  }

  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw createError(401, "Current password is incorrect");
  }

  user.password = await bcrypt.hash(newPassword, saltRounds);
  await user.save();

  res.json({ message: "Password updated" });
});

router.delete("/me", auth, async (req, res) => {
  await User.findByIdAndDelete(req.user._id);
  res.json({ message: "Account deleted" });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw createError(400, "email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    // Return success even if user not found to prevent email enumeration
    return res.json({ message: "If that email is registered, a reset link has been sent" });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  await sendPasswordResetEmail(email, resetToken);

  res.json({ message: "If that email is registered, a reset link has been sent" });
});

router.post("/reset-password/:token", async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw createError(400, "password is required");
  }

  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    throw createError(400, "Invalid or expired reset token");
  }

  user.password = await bcrypt.hash(password, saltRounds);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ message: "Password has been reset" });
});

module.exports = router;
