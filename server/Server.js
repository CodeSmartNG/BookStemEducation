import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PAYSTACK_SECRET = "sk_test_xxxxxxx"; // saka naka

// STEP 1: Initialize payment
app.post("/init-payment", async (req, res) => {
  try {
    const { email, amount } = req.body;

    const paystackRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // Paystack uses *kobo*
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      status: true,
      authorization_url: paystackRes.data.data.authorization_url,
      reference: paystackRes.data.data.reference,
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
});

// STEP 2: Verify Payment
app.get("/verify-payment/:reference", async (req, res) => {
  try {
    const { reference } = req.params;

    const verify = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    if (verify.data.data.status === "success") {
      // Store payment → unlock course here
      return res.json({
        status: true,
        message: "Payment successful",
        data: verify.data.data,
      });
    }

    res.json({ status: false, message: "Payment failed" });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));