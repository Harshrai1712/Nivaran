const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  register,
  login,
  getProfile,
  updateSettings,
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authMiddleware, getProfile);
router.put('/settings', authMiddleware, updateSettings);

module.exports = router;
