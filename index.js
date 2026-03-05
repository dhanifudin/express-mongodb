require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("./config/passport");
const userRouter = require("./routes/users");
const postRouter = require("./routes/posts");
const paymentRouter = require("./routes/payments");
const auth = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");

const port = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/express-mongodb";

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");
    require("./models");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(passport.initialize());

app.use("/users", userRouter);
app.use("/posts", auth, postRouter);
app.use("/payments", paymentRouter);

app.use(errorHandler);

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
