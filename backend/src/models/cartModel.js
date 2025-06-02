const pool = require('../config/db'); // Use the PostgreSQL pool

class Cart {
    static async getOrCreateCart(userId) {
        // Use $1 for placeholder, and pool.query for simple queries
        let result = await pool.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
        let cartId;
        if (result.rows.length > 0) {
            cartId = result.rows[0].id;
        } else {
            // Use RETURNING id to get the new ID for PostgreSQL
            const insertResult = await pool.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId]);
            cartId = insertResult.rows[0].id; // Get ID from rows
        }
        return cartId;
    }

    static async getCartItems(cartId) {
        const result = await pool.query(
            `SELECT ci.id, p.name, ci.quantity, ci.price
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.cart_id = $1`,
            [cartId]
        );
        return result.rows; // pg returns rows in result.rows
    }

    static async addOrUpdateCartItem(cartId, productId, quantity, price) {
        // Check if item already exists in cart
        const existingItemResult = await pool.query(
            'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
            [cartId, productId]
        );

        if (existingItemResult.rows.length > 0) {
            // Update quantity
            await pool.query(
                'UPDATE cart_items SET quantity = quantity + $1 WHERE cart_id = $2 AND product_id = $3',
                [quantity, cartId, productId]
            );
        } else {
            // Add new item
            await pool.query(
                'INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [cartId, productId, quantity, price]
            );
        }
        return true;
    }

    static async clearCart(cartId) {
        await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
        return true;
    }

    // Recommended improvement for getProductByName (handles not found case)
    static async getProductByName(productName) {
        // Acquire a client for explicit connection handling (though pool.query is often fine here too)
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT id, price FROM products WHERE name = $1', [productName]);
            return result.rows.length > 0 ? result.rows[0] : null; // Return null if product not found
        } catch (error) {
            console.error('Error in getProductByName:', error);
            throw error;
        } finally {
            if (client) client.release(); // Release client back to pool
        }
    }

    static async removeItemFromCart(cartId, productIdToRemove) {
        const client = await pool.connect(); // Acquire a client for transaction/specific control
        try {
            const result = await client.query(
                'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2',
                [cartId, productIdToRemove]
            );
            return result.rowCount > 0; // pg uses rowCount for affected rows
        } catch (error) {
            console.error('Error in removeItemFromCart:', error);
            throw error;
        } finally {
            if (client) client.release();
        }
    }
}

module.exports = Cart;