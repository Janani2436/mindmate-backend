import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import connectDB from './config/db.js';
import moodRoutes from './routes/moodRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Connect to MongoDB
connectDB();

// ✅ Middleware
app.use(express.json());

// ✅ CORS setup (Netlify + Localhost support)
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://mindmate-emo.netlify.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ API Routes
app.use('/api/mood', moodRoutes);
app.use('/api/auth', authRoutes);  // register, login
app.use('/api/chat', chatRoutes);  // chat, history (protected)

// ✅ Health check route
app.get('/', (req, res) => {
  res.send('✅ MindMate backend is running!');
});

// ✅ 404 Route (catch-all)
app.use('*', (req, res) => {
  res.status(404).json({ message: '❌ Route not found' });
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
