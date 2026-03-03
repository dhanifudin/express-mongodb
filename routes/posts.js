const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const Post = require("../models/Post");

// Create
router.post("/", async (req, res) => {
  const { title, body } = req.body;
  if (!title) throw createError(400, "title is required");
  if (!body) throw createError(400, "body is required");
  const post = await Post.create({ title, body, author: req.user._id });
  res.status(201).json(post);
});

// Read all
router.get("/", async (_req, res) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate("author", "name email");
  res.json(posts);
});

// Read one
router.get("/:id", async (req, res) => {
  const post = await Post.findById(req.params.id).populate(
    "author",
    "name email",
  );
  if (!post) throw createError(404, "Post not found");
  res.json(post);
});

// Update
router.put("/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw createError(404, "Post not found");
  if (!post.author.equals(req.user._id)) throw createError(403, "Forbidden");
  const { title, body } = req.body;
  if (title !== undefined) post.title = title;
  if (body !== undefined) post.body = body;
  await post.save();
  res.json(post);
});

// Delete
router.delete("/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw createError(404, "Post not found");
  if (!post.author.equals(req.user._id)) throw createError(403, "Forbidden");
  await post.deleteOne();
  res.json({ message: "Post deleted" });
});

module.exports = router;
