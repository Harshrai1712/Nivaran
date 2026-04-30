require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { initializeFirebase } = require('./config/firebase');

// Initialize Express
const app = express();

// Initialize Firebase
initializeFirebase();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/data', require('./routes/data'));

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚭 Smoke Detector Wristband API is running',
    version: '1.0.0',
    endpoints: {
      auth: ['/auth/register', '/auth/login', '/auth/me', '/auth/settings'],
      data: ['/data/add', '/data/today', '/data/date/:date', '/data/month', '/data/weekly'],
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}`);
  console.log(`🔥 Firebase: ${process.env.FIREBASE_DATABASE_URL || 'Check configuration'}\n`);
});

module.exports = app;
