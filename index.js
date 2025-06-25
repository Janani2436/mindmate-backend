import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import moodRoutes from './routes/moodRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import connectDB from './config/db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// ✅ Enable CORS for Netlify and localhost
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://mindmate-emo.netlify.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ✅ Body parser for JSON
app.use(express.json());

// ✅ Routes
app.use('/api/mood', moodRoutes);
app.use('/api/auth', authRoutes); // includes /register and /login
app.use('/api/chat', chatRoutes);

// ✅ Optional: Root health route
app.get('/', (req, res) => {
  res.send('MindMate backend is running');
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('❗ Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
