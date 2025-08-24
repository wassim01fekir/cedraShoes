import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
app.use(cors());               // allow requests from your frontend
app.use(express.json());       // parse JSON bodies

// --- Nodemailer via SendGrid SMTP ---
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false,
  auth: {
    user: "apikey",                         // literally the string "apikey"
    pass: process.env.SENDGRID_API_KEY      // set on Render
  }
});

// Health check
app.get("/", (req, res) => res.send("CedraShoes backend OK"));

app.post("/send-order", async (req, res) => {
  try {
    const { name, phone, address, items, total } = req.body;

    if (!name || !phone || !address || !Array.isArray(items) || !total) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    const mailOptions = {
      from: process.env.ORDER_FROM_EMAIL,   // e.g. no-reply@yourdomain.com or your gmail
      to: process.env.ORDER_TO_EMAIL,       // where you receive orders
      subject: "📦 طلب جديد من CedraShoes",
      text: `
📦 طلب جديد من CedraShoes

👤 الاسم: ${name}
📞 الهاتف: ${phone}
📍 العنوان: ${address}

🛒 الطلب:
${items.join("\n")}

💰 المجموع: ${total} دج
`
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Email error:", err);
    res.status(500).json({ success: false, error: "Email send failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
