// backend/src/controllers/productController.js
const pool = require('../config/db');

const getAllProducts = async (req, res) => {
    try {
        const [products] = await pool.execute('SELECT id, name, description, category, price, image_url AS imageUrl FROM products ORDER BY name ASC');
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).json({ message: 'Failed to retrieve products.', error: error.message });
    }
};

module.exports = {
    getAllProducts,
};