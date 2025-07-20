import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import connectDB from './config/db.js';
import moodRoutes from './routes/moodRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import videoChatRoutes from './routes/videoChatRoutes.js';
import emotionRoutes from './routes/emotionRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://mindmate-emo.netlify.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// API Routes
app.use('/api/mood', moodRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);         // ✅ now points to POST /api/chat
app.use('/api/videochat', videoChatRoutes);
app.use('/api/emotion', emotionRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('✅ MindMate backend is running!');
});

// 404 route
app.use('*', (req, res) => {
  res.status(404).json({ message: '❌ Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❗ Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
