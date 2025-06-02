const express = require('express');
const { getCartItems, addToCart, deleteCartItem } = require('../controllers/cartController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, getCartItems);
router.post('/', authenticateToken, addToCart);

router.delete('/:itemName', authenticateToken, deleteCartItem); 

module.exports = router;c