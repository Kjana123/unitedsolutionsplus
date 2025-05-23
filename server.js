const express = require("express");
const Razorpay = require("razorpay");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
require("dotenv").config(); // ✅ Load .env variables

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Email transporter setup
const transporter = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ✅ Sample Route (e.g., payment success)
app.post("/payment-success", async (req, res) => {
  const { paymentId, orderId, signature, amount, email } = req.body;

  const generated_signature = require("crypto")
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(orderId + "|" + paymentId)
    .digest("hex");

  if (generated_signature !== signature) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  // ✅ Generate PDF
  const receiptPath = path.join(__dirname, `receipt_${paymentId}.pdf`);
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(receiptPath));
  doc.fontSize(16).text("United Solutions Plus", { align: "center" });
  doc.moveDown();
  doc.text(`Receipt for Payment ID: ${paymentId}`);
  doc.text(`Amount Paid: ₹${amount}`);
  doc.text(`Order ID: ${orderId}`);
  doc.end();

  // ✅ Send email
  transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Your Payment Receipt - United Solutions Plus",
    text: "Thank you for your payment. Please find the attached receipt.",
    attachments: [
      {
        filename: "receipt.pdf",
        path: receiptPath,
        contentType: "application/pdf",
      },
    ],
  }, (err, info) => {
    if (err) {
      console.error("Email failed:", err);
      return res.status(500).send("Payment processed but email failed");
    }
    console.log("Email sent:", info.response);
    return res.status(200).send("Payment successful and receipt emailed");
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

