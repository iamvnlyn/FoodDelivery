const pool = require('../config/db'); // Use the PostgreSQL pool

class Order {
    static async createOrder(
        userId,
        totalAmount,
        firstName,
        middleName,
        lastName,
        street,
        barangay,
        houseNumber,
        city,
        paymentMethod,
        items
    ) {
        // Acquire a client from the pool for transactions
        const client = await pool.connect();
        try {
            await client.query('BEGIN'); // Start transaction for PostgreSQL

            // --- IMPORTANT: Update the INSERT statement and values with $ placeholders ---
            // Use RETURNING id to get the new ID for PostgreSQL
            const orderResult = await client.query(
                `INSERT INTO orders
                 (user_id, total_amount, first_name, middle_name, last_name, street, barangay, house_number, city, payment_method, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending') RETURNING id`,
                [
                    userId,
                    totalAmount,
                    firstName,
                    middleName,
                    lastName,
                    street,
                    barangay,
                    houseNumber,
                    city,
                    paymentMethod
                ]
            );
            const orderId = orderResult.rows[0].id; // Get ID from rows

            for (const item of items) {
                // It's crucial to fetch the product's actual price from the database for security.
                const productInfoResult = await client.query('SELECT id, price FROM products WHERE name = $1', [item.name]);

                if (!productInfoResult.rows || productInfoResult.rows.length === 0) {
                    throw new Error(`Product not found: ${item.name}`);
                }
                const productId = productInfoResult.rows[0].id;
                const productPrice = parseFloat(productInfoResult.rows[0].price);

                await client.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, price_at_order) VALUES ($1, $2, $3, $4)',
                    [orderId, productId, item.quantity, productPrice]
                );
            }

            await client.query('COMMIT'); // Commit transaction for PostgreSQL
            return orderId;
        } catch (error) {
            await client.query('ROLLBACK'); // Rollback transaction for PostgreSQL
            throw error;
        } finally {
            client.release(); // Release client back to pool
        }
    }

    static async getOrdersByUserId(userId) {
        // Use $1 for placeholder
        const ordersResult = await pool.query(
            `SELECT id, total_amount, first_name, middle_name, last_name, street, barangay, house_number, city, payment_method, status, ordered_at
             FROM orders WHERE user_id = $1 ORDER BY ordered_at DESC`,
            [userId]
        );

        const orders = ordersResult.rows; // pg returns rows in result.rows

        for (const order of orders) {
            const itemsResult = await pool.query(
                `SELECT oi.quantity, oi.price_at_order AS price, p.name AS product_name
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id = $1`,
                [order.id]
            );
            order.items = itemsResult.rows;
        }
        return orders;
    }
}

module.exports = Order;