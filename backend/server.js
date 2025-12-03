import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/paystack/initialize", async (req, res) => {
  const { email, amount, metadata } = req.body;

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      amount: amount * 100,
      metadata
    })
  });

  const data = await response.json();
  res.json(data);
});

app.listen(3001, () => console.log("Server running on port 3001"));