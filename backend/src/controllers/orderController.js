const Order = require('../models/orderModel');
const Cart = require('../models/cartModel'); // To clear the cart after purchase


const createOrder = async (req, res) => {
    const userId = req.user.id; // From authMiddleware

    // --- IMPORTANT: Update destructuring to match new frontend data ---
    const {
        items,
        firstName,
        middleName, // This can be an empty string from frontend
        lastName,
        street,
        barangay,
        houseNumber, // This can be an empty string from frontend
        city,
        paymentMethod
    } = req.body;

    // --- Update validation to check new required fields ---
    if (!items || items.length === 0 || !firstName || !lastName || !street || !barangay || !city || !paymentMethod) {
        return res.status(400).json({ message: 'Missing required order details (name or address).' });
    }

    try {
        let totalAmount = 0;
        // It's highly recommended to fetch product prices from the database here
        // for security and accuracy, rather than trusting prices from the frontend.
        // For now, we'll continue using item.price as per your existing logic,
        // but keep this security note in mind.
        for (const item of items) {
            totalAmount += item.quantity * item.price;
        }

        // --- IMPORTANT: Update the Order.createOrder call with new arguments ---
        const orderId = await Order.createOrder(
            userId,
            totalAmount,
            firstName,
            middleName || null, // Pass null if middleName is an empty string
            lastName,
            street,
            barangay,
            houseNumber || null, // Pass null if houseNumber is an empty string
            city,
            paymentMethod,
            items // items will be handled by the orderModel to create order_items
        );

        // Clear the user's cart after successful order placement
        // Assuming Cart.clearCart takes userId, or needs the actual cartId.
        // If your Cart.clearCart expects cartId, you might need to get it first.
        // Based on typical implementations, clearing by userId is common.
        await Cart.clearCart(userId); // Assuming Cart.clearCart clears the cart for a given user_id

        res.status(201).json({ message: 'Order placed successfully!', orderId });
    } catch (error) {
        console.error('Error creating purchase:', error);
        // Provide more detailed error message if needed for debugging
        res.status(500).json({ message: 'Failed to place order.', error: error.message });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.getOrdersByUserId(userId);
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: 'Failed to retrieve orders.', error: error.message });
    }
};

module.exports = {
    createOrder, // Export the renamed function
    getUserOrders
};