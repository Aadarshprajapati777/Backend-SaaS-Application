// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const morgan = require('morgan');
// const path = require('path');
// const dotenv = require('dotenv');

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configure environment variables
dotenv.config();

const corsOptions = {
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import documentRoutes from './routes/documents.js';
import modelRoutes from './routes/models.js';
import chatRoutes from './routes/chat.js';
import teamRoutes from './routes/teams.js';
import paymentRoutes from './routes/payments.js';
import companyRoutes from './routes/companyRoutes.js';


// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Get directory name (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-document-chat-saas')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import models for use in routes
import Company from './models/Company.js';
import CompanyContext from './models/CompanyContext.js';

// Make models available throughout the app
app.set('models', {
  Company,
  CompanyContext
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/companies', companyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

// Base route
app.get('/', (req, res) => {
  res.send('AI Document Chat SaaS API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app; 