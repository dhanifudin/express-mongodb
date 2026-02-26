require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const postRouter = require("./routes/posts");

const port = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/express-mongodb";

const app = express();

const corsOptions = {
  origin: "*",
};

app.use(express.json());
app.use(cors(corsOptions));

// MongoDB connection (centralized in index.js)
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    // Load models after DB connection is established
    try {
      require("./models");
    } catch (e) {
      console.warn("Model load failed:", e);
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/posts", postRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
