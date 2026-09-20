const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// Public Routes
router.post('/signup/citizen', authController.signupCitizen);
router.post('/signup/officer', authController.signupOfficer);
router.post('/login', authController.login);

// Example protected route for testing (Can be deleted later)
router.get('/me', authenticate, (req, res) => {
  res.json({ status: 'success', data: { user: req.user } });
});

// Example officer-only route for testing (Can be deleted later)
router.get('/officer-only', authenticate, requireRole(['OFFICER', 'ADMIN']), (req, res) => {
  res.json({ status: 'success', message: 'Welcome, Officer!' });
});

module.exports = router;
