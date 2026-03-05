const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const auth = require("../middleware/auth");
const { snap, coreApi } = require("../services/midtrans");

// POST /payments/snap/token — create Snap transaction token (auth required)
router.post("/snap/token", auth, async (req, res) => {
  const { order_id, gross_amount, item_details, customer_details } = req.body;
  if (!order_id) throw createError(400, "order_id is required");
  if (!gross_amount) throw createError(400, "gross_amount is required");

  const parameter = {
    transaction_details: { order_id, gross_amount },
    credit_card: { secure: true },
    ...(item_details && { item_details }),
    ...(customer_details && { customer_details }),
  };

  const transaction = await snap.createTransaction(parameter);
  res.json({ token: transaction.token, redirect_url: transaction.redirect_url });
});

// POST /payments/notification — Midtrans webhook (no auth, called by Midtrans server)
router.post("/notification", async (req, res) => {
  const notification = await coreApi.transaction.notification(req.body);
  const { order_id, transaction_status, fraud_status } = notification;

  let status;
  if (transaction_status === "capture") {
    status = fraud_status === "accept" ? "success" : "challenge";
  } else if (transaction_status === "settlement") {
    status = "success";
  } else if (["cancel", "deny", "expire"].includes(transaction_status)) {
    status = "failure";
  } else if (transaction_status === "pending") {
    status = "pending";
  }

  // TODO: update your order in the database based on order_id and status
  console.log(`Payment notification — order: ${order_id}, status: ${status}`);

  res.json({ status: "OK" });
});

// GET /payments/status/:orderId — get transaction status (auth required)
router.get("/status/:orderId", auth, async (req, res) => {
  const statusResponse = await coreApi.transaction.status(req.params.orderId);
  res.json(statusResponse);
});

module.exports = router;
