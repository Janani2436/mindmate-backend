// MindMate backend - index.js

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
import aiRoutes from './routes/aiRoutes.js';
import usersRouter from './routes/users.js';

import therapyCasesRouter from './routes/therapyCases.js';
import therapySessionsRouter from './routes/therapySessions.js';
import feedbackRouter from './routes/feedback.js';
import aiRecommendationsRouter from './routes/aiRecommendations.js';
const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection
connectDB();

// Setup middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://mindmate-emo.netlify.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Routing APIs
app.use('/api/ai', aiRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/videochat', videoChatRoutes);
app.use('/api/emotion', emotionRoutes);
app.use('/api/therapy-cases', therapyCasesRouter);
app.use('/api/therapy-sessions', therapySessionsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/users', usersRouter);
app.use('/api/ai-recommendations', aiRecommendationsRouter);

// Root route
app.get('/', (req, res) => {
  res.send('✅ MindMate backend is running!');
});

// Enhanced /routes-list endpoint to list all routes including nested routers
app.get('/routes-list', (req, res) => {
  const getRoutes = (stack, prefix = '') =>
    stack
      .filter(layer => layer.route || layer.name === 'router')
      .flatMap(layer => {
        if (layer.route) {
          return [prefix + layer.route.path];
        } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
          // Extract path from regex source, preserving slashes
          const regexStr = layer.regexp.source
            // Remove regex start/end markers and flags
            .replace('^\\/', '/')
            .replace('\\/?(?=\\/|$)', '')
            .replace(/\\\^|\$|\\\/\?\(\?:\(\[\^\\\/]+\?\)\)/g, '')
            .replace(/\\\//g, '/');

          const newPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;

          // Compose with slash safely
          const path = newPrefix + (regexStr.startsWith('/') ? regexStr : '/' + regexStr);

          return getRoutes(layer.handle.stack, path);
        }
        return [];
      });
  const allRoutes = getRoutes(app._router.stack);
  res.json(allRoutes);
});



// 404 error handling
app.use('*', (req, res) => {
  res.status(404).json({ message: '❌ Route not found' });
});

// Global error handler
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
