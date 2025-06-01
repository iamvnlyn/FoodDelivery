const express = require('express');
const router = express.Router();
// Destructure getMe as well from authController
const { register, login, getUserProfile, getMe } = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getUserProfile); // Protected route
router.get('/me', authenticateToken, getMe);

module.exports = router;
