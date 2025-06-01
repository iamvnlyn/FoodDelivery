const pool = require('../config/db');

class Cart {
    static async getOrCreateCart(userId) {
        let [rows] = await pool.execute('SELECT id FROM carts WHERE user_id = ?', [userId]);
        let cartId;
        if (rows.length > 0) {
            cartId = rows[0].id;
        } else {
            const [result] = await pool.execute('INSERT INTO carts (user_id) VALUES (?)', [userId]);
            cartId = result.insertId;
        }
        return cartId;
    }

    static async getCartItems(cartId) {
        const [rows] = await pool.execute(
            `SELECT ci.id, p.name, ci.quantity, ci.price
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.cart_id = ?`,
            [cartId]
        );
        return rows;
    }

    static async addOrUpdateCartItem(cartId, productId, quantity, price) {
        // Check if item already exists in cart
        const [existingItem] = await pool.execute(
            'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
            [cartId, productId]
        );

        if (existingItem.length > 0) {
            // Update quantity
            await pool.execute(
                'UPDATE cart_items SET quantity = quantity + ? WHERE cart_id = ? AND product_id = ?',
                [quantity, cartId, productId]
            );
        } else {
            // Add new item
            await pool.execute(
                'INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [cartId, productId, quantity, price]
            );
        }
        return true;
    }

    static async clearCart(cartId) {
        await pool.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
        return true;
    }

    static async getProductByName(productName) {
        const [rows] = await pool.execute('SELECT id, price FROM products WHERE name = ?', [productName]);
        return rows[0];
    }

    static async removeItemFromCart(cartId, productIdToRemove) {
        let connection; // Declare connection here
        try {
            connection = await pool.getConnection(); // Get a connection from the pool
            const [result] = await connection.execute(
                'DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?',
                [cartId, productIdToRemove]
            );
            return result.affectedRows > 0; // True if one or more rows were deleted
        } catch (error) {
            console.error('Error in removeItemFromCart:', error);
            throw error;
        } finally {
            if (connection) connection.release(); // Release connection back to pool
        }
    }

    // Recommended improvement for getProductByName (handles not found case)
    static async getProductByName(productName) {
        let connection;
        try {
            connection = await pool.getConnection();
            const [rows] = await connection.execute('SELECT id, price FROM products WHERE name = ?', [productName]);
            return rows.length > 0 ? rows[0] : null; // Return null if product not found
        } catch (error) {
            console.error('Error in getProductByName:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

}

module.exports = Cart;