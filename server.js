const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

// Root route
app.get("/", (req, res) => {
  res.send("🚀 M-Pesa STK Push App is running on Railway!");
});

// 1. Get Token Route
app.get("/token", async (req, res) => {
  try {
    const auth = Buffer.from(
      process.env.CONSUMER_KEY + ":" + process.env.CONSUMER_SECRET
    ).toString("base64");

    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    );

    res.json(response.data);
  } catch (error) {
    console.error("❌ Failed to fetch token:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch access token" });
  }
});

// 2. STK Push Route
app.post("/stkpush", async (req, res) => {
  try {
    const auth = Buffer.from(
      process.env.CONSUMER_KEY + ":" + process.env.CONSUMER_SECRET
    ).toString("base64");

    const tokenResponse = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    );

    const accessToken = tokenResponse.data.access_token;

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14);

    const password = Buffer.from(
      process.env.SHORTCODE + process.env.PASSKEY + timestamp
    ).toString("base64");

    const stkResponse = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: process.env.SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: req.body.amount || 1,
        PartyA: req.body.phone || process.env.PHONE_NUMBER,
        PartyB: process.env.SHORTCODE,
        PhoneNumber: req.body.phone || process.env.PHONE_NUMBER,
        CallBackURL: process.env.CALLBACK_URL,
        AccountReference: "CompanyXLTD",
        TransactionDesc: "Payment of X",
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    res.json(stkResponse.data);
  } catch (error) {
    console.error("❌ Error in /stkpush:", error.response?.data || error.message);
    res.status(500).json({ error: "STK Push failed" });
  }
});

// 3. Callback Route
app.post("/callback", (req, res) => {
  console.log("📩 STK Callback:", JSON.stringify(req.body, null, 2));
  res.json({ message: "Callback received successfully" });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
