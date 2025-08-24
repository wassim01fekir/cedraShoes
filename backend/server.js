import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
app.use(cors());
app.use(express.json());

// --- Nodemailer via SendGrid SMTP ---
const transporter = nodemailer.createTransport({  // ✅ Fixed: createTransport not createTransporter
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SendGrid configuration error:", error);
  } else {
    console.log("✅ SendGrid is ready to send emails");
  }
});

// Health check
app.get("/", (req, res) => res.send("CedraShoes backend OK"));

app.post("/send-order", async (req, res) => {
  try {
    console.log("📦 Received order:", req.body);
    
    const { name, phone, address, items, total } = req.body;

    // Validation
    if (!name || !phone || !address || !Array.isArray(items) || !total) {
      console.error("❌ Missing required fields");
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields" 
      });
    }

    // Check environment variables
    if (!process.env.SENDGRID_API_KEY || !process.env.ORDER_FROM_EMAIL || !process.env.ORDER_TO_EMAIL) {
      console.error("❌ Missing environment variables");
      console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('ORDER') || k.includes('SENDGRID')));
      return res.status(500).json({ 
        success: false, 
        error: "Server configuration error - missing environment variables" 
      });
    }

    const mailOptions = {
      from: process.env.ORDER_FROM_EMAIL,
      to: process.env.ORDER_TO_EMAIL,
      subject: "📦 طلب جديد من CedraShoes",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2 style="color: #667eea;">📦 طلب جديد من CedraShoes</h2>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 15px 0;">
            <h3>👤 معلومات العميل:</h3>
            <p><strong>الاسم:</strong> ${name}</p>
            <p><strong>الهاتف:</strong> ${phone}</p>
            <p><strong>العنوان:</strong> ${address}</p>
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 10px; margin: 15px 0;">
            <h3>🛒 المنتجات المطلوبة:</h3>
            <ul style="list-style: none; padding: 0;">
              ${items.map(item => `<li style="padding: 5px 0; border-bottom: 1px solid #ddd;">• ${item}</li>`).join('')}
            </ul>
          </div>

          <div style="background: #e8f5e8; padding: 15px; border-radius: 10px; margin: 15px 0; text-align: center;">
            <h3 style="color: #2e7d32;">💰 المبلغ الإجمالي: ${total} دج</h3>
          </div>

          <hr>
          <p style="color: #666; font-size: 0.9em;">
            تم إرسال هذا الطلب من موقع CedraShoes<br>
            التاريخ: ${new Date().toLocaleString('ar-SA')}
          </p>
        </div>
      `,
      text: `
طلب جديد من CedraShoes

الاسم: ${name}
الهاتف: ${phone}
العنوان: ${address}

المنتجات:
${items.join("\n")}

المجموع: ${total} دج

التاريخ: ${new Date().toLocaleString('ar-SA')}
      `
    };

    console.log("📤 Sending email to:", process.env.ORDER_TO_EMAIL);
    const result = await transporter.sendMail(mailOptions);
    
    console.log("✅ Email sent successfully:", result.messageId);
    res.json({ 
      success: true, 
      messageId: result.messageId 
    });

  } catch (err) {
    console.error("❌ Email error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message || "Email send failed" 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📧 Email config: FROM=${process.env.ORDER_FROM_EMAIL} TO=${process.env.ORDER_TO_EMAIL}`);
  console.log(`🔑 SendGrid API Key configured: ${process.env.SENDGRID_API_KEY ? 'Yes' : 'No'}`);
});