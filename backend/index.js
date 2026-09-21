const { GoogleGenerativeAI } = require("@google/generative-ai");
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Resend } = require('resend');

const Message = require('./models/Message');

const app = express();

// ✅ Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ FIXED MODEL (IMPORTANT)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
}));
app.use(express.json());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch((err) => console.error('MongoDB Connection Error:', err));


// =============================
// CONTACT API
// =============================
app.post('/api/contact', async (req, res) => {
  const { fullname, email, message } = req.body;

  if (!fullname || !email || !message) {
    return res.status(400).json({
      success: false,
      error: 'Please provide all fields.',
    });
  }

  try {
    const newMessage = new Message({ fullname, email, message });
    await newMessage.save();

    await resend.emails.send({
      from: 'onboarding@resend.dev',
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
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Thanks for contacting me!',
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
      message: 'Message sent successfully!',
    });

  } catch (error) {
    console.error('Error handling contact submission:', error);
    res.status(500).json({
      success: false,
      reply: "Sorry, I’m having trouble responding right now. Please try again."
    });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    const prompt = `You are Pranjali Bansode's AI assistant. Answer strictly based on the provided information. Do not guess or assume anything. If information is not available, respond politely that you don’t have that information. Be clear, complete, and warm — do not cut answers short and do not use FAANG-interview bullet fragments.

ABOUT PRANJALI:
- Final year ECE student, Aspiring SDE
- Java + DSA: 700+ problems solved, 2000+ GeeksforGeeks score, 200+ LeetCode problems
- Skills: Java, C, C++, JavaScript, Python, HTML/CSS, React.js, Node.js, Express.js, MongoDB, MySQL, REST APIs

PROJECTS:
1. ExpenseIQ — A smart expense management system built with Flask that helps users track daily expenses, set budgets, and analyze spending. Includes expense categorization, budget alerts, recurring expenses, reports, and OCR-based receipt scanning.
2. Spotify Clone — A music streaming web app that lets users search and play songs using the Jamendo API. Features a modern UI, music controls (play/pause/next), and dynamic song loading, replicating core Spotify functionality.
3. TravelTales — A travel-based web platform where users can explore, share, and manage travel experiences. Lets users view destinations, post travel stories, and interact with travel content through a clean, user-friendly interface.

CONTACT:
- Phone: 8080635198
- Email: bansodepranjali5@gmail.com
- LinkedIn: linkedin.com/in/pranjalibansode
- GitHub: github.com/pranjali-Bansode

FORMAT RULES:
- If asked about projects: start with one line like "Pranjali builds various projects, listed below:" then a numbered list (1., 2., 3.) with the project name in bold and a full 2-3 sentence description for each, exactly as given above.
- If asked how to contact her: write one short sentence mentioning phone, email, and LinkedIn together, using the details above.
- If asked about skills: give a short intro line then a clean bullet list grouped naturally (languages, frontend, backend, tools).
- Never invent facts not listed above.
- If the question is unrelated to Pranjali, reply: "I can help with Pranjali's skills, projects, or experience 😊"

USER QUESTION:
${message}

Respond in full, complete sentences — do not truncate or abbreviate.`;

    let result;
    let retries = 2;

    while (retries > 0) {
      try {
        result = await model.generateContent(prompt);
        break;
      } catch (err) {
        if (err.status === 503) {
          console.log("Retrying Gemini...");
          retries--;
          await new Promise(r => setTimeout(r, 1000)); // wait 1 sec
        } else {
          throw err;
        }
      }
    }

    if (!result) {
      return res.json({
        success: true,
        reply: "I'm a bit busy right now 😅 Please try again in a moment!"
      });
    }

    let text = result.response.text().trim();

    res.json({
      success: true,
      reply: text || "I can help with Pranjali's skills, projects, or experience 😊"
    });

  } catch (error) {
    console.error("Gemini Error:", error);

    res.json({
      success: true,
      reply: "I'm having a small issue right now, but feel free to ask again 😊"
    });
  }
});

// =============================
// START SERVER
// =============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});