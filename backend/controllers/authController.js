const User = require('../models/User');  // Import the User model
const bcrypt = require('bcryptjs');  // For password comparison
const jwt = require('jsonwebtoken');  // For JWT token generation
const dotenv = require('dotenv');
dotenv.config();
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto'); // Used to generate a random reset code

// User Registration (Signup)
exports.registerUser = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase();
    const { password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const user = new User({ email, password });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// User Login (Signin)
exports.loginUser = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase();
    const { password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Forgot Password (request reset)
exports.forgotPassword = async (req, res) => {
  const email = req.body.email.toLowerCase();
  // Check if the user exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Email is not registered' });
  }

  // Generate a 4-digit code
  const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
  const resetCodeExpires = Date.now() + 15 * 60 * 1000; // 15 minutes expiration

  // Update the user's reset code and expiration in the database
  user.resetCode = resetCode;
  user.resetCodeExpires = resetCodeExpires;
  await user.save();

  // Send the 4-digit code to the user's email
  const subject = 'Your Hairstylist Password Reset Code';
  const text = `Your password reset code is: ${resetCode}\nThis code will expire in 15 minutes.`;

  try {
    await sendEmail(email, subject, text);
    res.status(200).json({ message: 'Reset code sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send reset email' });
  }
};

// Reset Password (use the code to reset password)
exports.resetPassword = async (req, res) => {
  const { resetCode, newPassword } = req.body;

  // Find user with the reset code and check if it's still valid
  const user = await User.findOne({
    resetCode,
    resetCodeExpires: { $gt: Date.now() }, // Check if code is not expired
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset code' });
  }

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);

  // Clear reset code and expiration after password reset
  user.resetCode = undefined;
  user.resetCodeExpires = undefined;

  await user.save();

  res.status(200).json({ message: 'Password reset successfully' });
};
