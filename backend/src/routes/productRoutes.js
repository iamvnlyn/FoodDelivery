const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController'); // Make sure this path is correct

// Route to get all products
router.get('/', productController.getAllProducts);

// You can add other product-related routes here if needed in the future
// router.get('/:id', productController.getProductById);

module.exports = router;