// backend/src/routes/chatRoutes.js
console.log('--- chatRoutes.js loaded ---'); // <--- PLACE THIS AT THE VERY TOP

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticateToken = require('../middleware/authMiddleware');


router.get('/:ownerId', authenticateToken, chatController.getChatHistory);

router.post('/', authenticateToken, chatController.sendMessage);

module.exports = router;