const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/firebase');

/**
 * Generate JWT token for a user
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * POST /auth/register
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const db = getDatabase();

    // Check if user already exists
    const usersRef = db.ref('users');
    const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');

    if (snapshot.exists()) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in Firebase
    const newUserRef = usersRef.push();
    const userId = newUserRef.key;

    const userData = {
      id: userId,
      name,
      email,
      password: hashedPassword,
      dailyLimit: 5,
      createdAt: new Date().toISOString(),
    };

    await newUserRef.set(userData);

    // Create default settings
    await db.ref(`userSettings/${userId}`).set({
      darkMode: false,
      notifications: true,
      reminders: true,
      dailyLimit: 5,
    });

    // Generate token
    const token = generateToken({ id: userId, email, name });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        token,
        user: {
          id: userId,
          name,
          email,
          dailyLimit: 5,
        },
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.',
    });
  }
};

/**
 * POST /auth/login
 * Login user and return JWT
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const db = getDatabase();

    // Find user by email
    const snapshot = await db
      .ref('users')
      .orderByChild('email')
      .equalTo(email)
      .once('value');

    if (!snapshot.exists()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Get user data
    let user = null;
    snapshot.forEach((child) => {
      user = { id: child.key, ...child.val() };
    });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Get user settings
    const settingsSnapshot = await db.ref(`userSettings/${user.id}`).once('value');
    const settings = settingsSnapshot.val() || {};

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          dailyLimit: user.dailyLimit || 5,
          settings,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
};

/**
 * GET /auth/me
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const db = getDatabase();
    const snapshot = await db.ref(`users/${req.user.id}`).once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const user = snapshot.val();
    const settingsSnapshot = await db.ref(`userSettings/${req.user.id}`).once('value');

    res.json({
      success: true,
      data: {
        id: req.user.id,
        name: user.name,
        email: user.email,
        dailyLimit: user.dailyLimit || 5,
        createdAt: user.createdAt,
        settings: settingsSnapshot.val() || {},
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

/**
 * PUT /auth/settings
 * Update user settings
 */
const updateSettings = async (req, res) => {
  try {
    const db = getDatabase();
    const { darkMode, notifications, reminders, dailyLimit } = req.body;

    const updates = {};
    if (darkMode !== undefined) updates.darkMode = darkMode;
    if (notifications !== undefined) updates.notifications = notifications;
    if (reminders !== undefined) updates.reminders = reminders;
    if (dailyLimit !== undefined) {
      updates.dailyLimit = dailyLimit;
      // Also update in user profile
      await db.ref(`users/${req.user.id}/dailyLimit`).set(dailyLimit);
    }

    await db.ref(`userSettings/${req.user.id}`).update(updates);

    res.json({
      success: true,
      message: 'Settings updated.',
      data: updates,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

module.exports = { register, login, getProfile, updateSettings };
