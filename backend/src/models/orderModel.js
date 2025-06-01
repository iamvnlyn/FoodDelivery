const pool = require('../config/db');

class Order {
    static async createOrder(
        userId,
        totalAmount,
        firstName,     // New parameter
        middleName,    // New parameter
        lastName,      // New parameter
        street,        // New parameter
        barangay,      // New parameter
        houseNumber,   // New parameter
        city,          // New parameter
        paymentMethod,
        items
    ) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // --- IMPORTANT: Update the INSERT statement and values ---
            const [orderResult] = await connection.execute(
                `INSERT INTO orders
                 (user_id, total_amount, first_name, middle_name, last_name, street, barangay, house_number, city, payment_method, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [
                    userId,
                    totalAmount,
                    firstName,
                    middleName, // Will be null if sent as null from controller
                    lastName,
                    street,
                    barangay,
                    houseNumber, // Will be null if sent as null from controller
                    city,
                    paymentMethod
                ]
            );
            const orderId = orderResult.insertId;

            for (const item of items) {
                // It's crucial to fetch the product's actual price from the database for security.
                // This prevents users from manipulating prices on the frontend.
                const [productInfo] = await connection.execute('SELECT id, price FROM products WHERE name = ?', [item.name]);

                if (!productInfo || productInfo.length === 0) {
                    throw new Error(`Product not found: ${item.name}`);
                }
                const productId = productInfo[0].id;
                const productPrice = parseFloat(productInfo[0].price); // Use the price from the database

                await connection.execute(
                    // Changed 'price' to 'price_at_order' as per common practice if you ever track price changes
                    'INSERT INTO order_items (order_id, product_id, quantity, price_at_order) VALUES (?, ?, ?, ?)',
                    [orderId, productId, item.quantity, productPrice] // Use productPrice from DB, not item.price from frontend
                );
            }

            await connection.commit();
            return orderId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getOrdersByUserId(userId) {
        // --- IMPORTANT: Update the SELECT query to fetch new columns ---
        const [orders] = await pool.execute(
            `SELECT id, total_amount, first_name, middle_name, last_name, street, barangay, house_number, city, payment_method, status, ordered_at
             FROM orders WHERE user_id = ? ORDER BY ordered_at DESC`,
            [userId]
        );

        for (const order of orders) {
            const [items] = await pool.execute(
                `SELECT oi.quantity, oi.price_at_order AS price, p.name AS product_name
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id = ?`,
                [order.id]
            );
            order.items = items;
        }
        return orders;
    }
}

module.exports = Order;