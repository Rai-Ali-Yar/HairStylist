const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register route
router.post('/register', authController.registerUser);

// Login route
router.post('/login', authController.loginUser);

// Reset password routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:resetCode', authController.resetPassword);

module.exports = router;
