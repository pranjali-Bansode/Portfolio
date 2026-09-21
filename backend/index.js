const { GoogleGenerativeAI } = require("@google/generative-ai");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { Resend } = require("resend");

const Message = require("./models/Message");

const app = express();

// =============================
// INIT SERVICES
// =============================
const resend = new Resend(process.env.RESEND_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ USE ONLY AVAILABLE MODEL
const model = genAI.getGenerativeModel({
  model: "gemini-3.5-flash"
});

// =============================
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());

// =============================
// DB CONNECTION
// =============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// =============================
// CONTACT API
// =============================
app.post("/api/contact", async (req, res) => {
  const { fullname, email, message } = req.body;

  if (!fullname || !email || !message) {
    return res.status(400).json({
      success: false,
      error: "Please provide all fields.",
    });
  }

  try {
    const newMessage = new Message({ fullname, email, message });
    await newMessage.save();

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: process.env.EMAIL_USER,
      subject: `New message from ${fullname}`,
      html: `
        <h3>New Contact Message</h3>
        <p><b>Name:</b> ${fullname}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b> ${message}</p>
      `,
    });

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Thanks for contacting me!",
      html: `
        <h3>Hi ${fullname},</h3>
        <p>Thanks for reaching out through my portfolio.</p>
        <p>I’ll get back to you soon.</p>
        <br/>
        <p>— Pranjali</p>
      `,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      reply: "Server error",
    });
  }
});

// =============================
// CHAT API
// =============================
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const prompt = `
You are Pranjali Bansode's AI assistant.

ABOUT PRANJALI:
- Final year ECE student, Aspiring SDE
- Java + DSA: 700+ problems solved, 2000+ GFG score, 200+ LeetCode
- Skills: Java, C, C++, JavaScript, Python, HTML/CSS, React, Node, Express, MongoDB, MySQL

PROJECTS:
1. ExpenseIQ - Expense tracker with budget alerts, OCR, reports
2. Spotify Clone - Music player using Jamendo API
3. TravelTales - Travel blogging platform

CONTACT:
Phone: 8080635198
Email: bansodepranjali5@gmail.com
LinkedIn: linkedin.com/in/pranjalibansode
GitHub: github.com/pranjali-Bansode

Rules:
- Be accurate
- If unknown say you don't know
- Keep answers clear and human

User: ${message}
`;

    const result = await model.generateContent({
  contents: [
    {
      role: "user",
      parts: [{ text: prompt }]
    }
  ]
});
    let text = result.response.text();

    res.json({
      success: true,
      reply: text || "I can help with Pranjali's info 😊",
    });

  } catch (error) {
  console.error("🔥 GEMINI DEPLOYMENT ERROR FULL:", error);

  res.status(500).json({
    success: false,
    reply: error?.message || JSON.stringify(error)
  });
}
});

// =============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});