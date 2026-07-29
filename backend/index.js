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

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// ✅ CONTACT FORM API
app.post('/api/contact', async (req, res) => {
  const { fullname, email, message } = req.body;

  if (!fullname || !email || !message) {
    return res.status(400).json({
      success: false,
      error: 'Please provide all fields.',
    });
  }

  try {
    // ✅ 1. Save to MongoDB
    const newMessage = new Message({ fullname, email, message });
    await newMessage.save();

    // ✅ 2. Send Email to YOU (Admin)
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.EMAIL_USER, // your email
      subject: `New message from ${fullname}`,
      html: `
        <h3>New Contact Message</h3>
        <p><b>Name:</b> ${fullname}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b> ${message}</p>
      `,
    });

    // ✅ 3. Send Confirmation Email to USER
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

    // ✅ 4. Success Response
    res.status(201).json({
      success: true,
      message: 'Message sent successfully!',
    });

  } catch (error) {
    console.error('Error handling contact submission:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});