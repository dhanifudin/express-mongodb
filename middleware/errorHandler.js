const { isHttpError } = require("http-errors");

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  // http-errors (thrown from routes)
  if (isHttpError(err)) {
    return res.status(err.status).json({ error: err.message });
  }

  // Auth errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired" });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  // Mongoose ValidationError
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(", ") });
  }

  // Mongoose duplicate key (unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ error: `${field} is already in use` });
  }

  // Unexpected errors
  res.status(500).json({ error: "Internal server error" });
}

module.exports = errorHandler;
