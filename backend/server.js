// Solution 1: Add self-ping to your server.js
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
app.use(cors());
app.use(express.json());

// Keep-alive function
function keepAlive() {
  const url = process.env.RENDER_EXTERNAL_URL || 'https://cedrashoes.onrender.com';
  
  setInterval(async () => {
    try {
      const response = await fetch(url);
      console.log(`Keep-alive ping: ${response.status} at ${new Date().toISOString()}`);
    } catch (error) {
      console.log(`Keep-alive failed: ${error.message}`);
    }
  }, 14 * 60 * 1000); // Ping every 14 minutes
}

// Start keep-alive only in production
if (process.env.NODE_ENV === 'production') {
  keepAlive();
}

// Rest of your existing server code...
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY
  }
});

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    status: "CedraShoes backend OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString() 
  });
});

app.post("/send-order", async (req, res) => {
  // Your existing order handling code...
  try {
    const { name, phone, address, items, total } = req.body;

    if (!name || !phone || !address || !Array.isArray(items) || !total) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    const mailOptions = {
      from: process.env.ORDER_FROM_EMAIL,
      to: process.env.ORDER_TO_EMAIL,
      subject: "📦 طلب جديد من CedraShoes",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>📦 طلب جديد من CedraShoes</h2>
          <p><strong>الاسم:</strong> ${name}</p>
          <p><strong>الهاتف:</strong> ${phone}</p>
          <p><strong>العنوان:</strong> ${address}</p>
          <p><strong>المنتجات:</strong></p>
          <ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>
          <p><strong>المجموع:</strong> ${total} دج</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ success: false, error: "Email send failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});