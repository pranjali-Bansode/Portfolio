const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const Message = require('./models/Message');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Contact Form Endpoint
app.post('/api/contact', async (req, res) => {
  const { fullname, email, message } = req.body;

  if (!fullname || !email || !message) {
    return res.status(400).json({ success: false, error: 'Please provide all fields.' });
  }

  try {
    // 1. Save to MongoDB
    const newMessage = new Message({ fullname, email, message });
    await newMessage.save();

    // 2. Email Notification to Admin (You)
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Portfolio Message from ${fullname}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${fullname}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    // 3. Confirmation Email to the User
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for getting in touch!',
      html: `
        <h3>Hi ${fullname},</h3>
        <p>Thank you for reaching out through my portfolio website!</p>
        <p>I have received your message and will get back to you as soon as possible.</p>
        <br />
        <p>Best regards,</p>
        <p>Pranjali Bansode</p>
      `,
    };

    // Send both emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);

    res.status(201).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error handling contact submission:', error);
    res.status(500).json({ success: false, error: 'Server error. Please try again later.' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});