const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Replace with your Razorpay keys
const razorpay = new Razorpay({
  key_id: "rzp_live_buDyJvlYXAHg07",
  key_secret: "JwQOLZutONfZODrS0v8TaYKv",
});

// API route to create Razorpay order
app.post("/create-order", async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // convert to paise
    currency: "INR",
    receipt: "receipt_order_" + Date.now(),
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ error: "Unable to create order" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


const crypto = require("crypto");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

app.post("/payment-success", async (req, res) => {
  const { paymentId, orderId, signature, amount } = req.body;

  const generated_signature = crypto
    .createHmac("sha256", razorpay.key_secret)
    .update(orderId + "|" + paymentId)
    .digest("hex");

  if (generated_signature !== signature) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Generate PDF
  const receiptPath = path.join(__dirname, `receipt_${paymentId}.pdf`);
  const doc = new PDFDocument();
  const writeStream = fs.createWriteStream(receiptPath);

  doc.pipe(writeStream);
  doc.fontSize(16).text("United Solutions Plus", { align: "center" });
  doc.moveDown();
  doc.text(`Receipt for Payment ID: ${paymentId}`);
  doc.text(`Amount Paid: ₹${amount}`);
  doc.text(`Order ID: ${orderId}`);
  doc.end();

  // When PDF is done writing, send email
  writeStream.on("finish", () => {
    const transporter = nodemailer.createTransport({
      host: "smtpout.secureserver.net",
      port: 465,
      secure: true,
      auth: {
        user: "info@unitedsolutionsplus.in",
        pass: "info@1234",
      },
    });

    const mailOptions = {
      from: "info@unitedsolutionsplus.in",
      to: "customer@example.com", // Replace with real email input
      subject: "Your Payment Receipt - United Solutions Plus",
      text: "Thank you for your payment. Please find the attached receipt.",
      attachments: [
        {
          filename: `receipt_${paymentId}.pdf`,
          path: receiptPath,
          contentType: "application/pdf"
        }
      ]
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Email failed:", err);
        return res.status(500).send("Payment processed but email failed");
      }
      console.log("Email sent:", info.response);
      return res.status(200).send("Payment successful and receipt emailed");
    });
  });

  writeStream.on("error", (err) => {
    console.error("PDF writing failed:", err);
    return res.status(500).send("Payment successful but receipt failed");
  });
});
