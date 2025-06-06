const Cart = require('../models/cartModel');

const getCartItems = async (req, res) => {
    console.log('--- Inside getCartItems controller ---');
    try {
        if (!req.user || !req.user.id) {
            console.error('--- req.user or req.user.id is missing in getCartItems ---');
            return res.status(401).json({ message: 'Authentication required.' });
        }
        const userId = req.user.id;
        console.log('--- User ID:', userId);

        const cartId = await Cart.getOrCreateCart(userId);
        console.log('--- Cart ID:', cartId);

        const items = await Cart.getCartItems(cartId);
        console.log('--- Fetched items:', items);

        res.status(200).json(items);
        console.log('--- Sent 200 response for cart items ---');
    } catch (error) {
        console.error("Error in getCartItems:", error);
        res.status(500).json({ message: "Failed to retrieve cart items.", error: error.message });
    }
};

const addToCart = async (req, res) => {
    const { itemName, quantity = 1 } = req.body; // Default quantity to 1
    const userId = req.user.id;

    if (!itemName) {
        return res.status(400).json({ message: "Item name is required." });
    }

    try {
        const product = await Cart.getProductByName(itemName);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        const cartId = await Cart.getOrCreateCart(userId);
        await Cart.addOrUpdateCartItem(cartId, product.id, quantity, product.price);

        res.status(200).json({ message: "Item added/updated in cart successfully!" });
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ message: "Failed to add item to cart.", error: error.message });
    }
};

const deleteCartItem = async (req, res) => {
    const userId = req.user.id; // User ID from authenticated token
    const itemNameToDelete = decodeURIComponent(req.params.itemName); // Get item name from URL

    try {
        const cartId = await Cart.getOrCreateCart(userId); // Ensure cart exists for the user
        const product = await Cart.getProductByName(itemNameToDelete); // Get product details (especially ID)

        if (!product) {
            return res.status(404).json({ message: `Product '${itemNameToDelete}' not found in product catalog.` });
        }

        // Call the model function to remove the item from the cart
        const success = await Cart.removeItemFromCart(cartId, product.id);

        if (success) {
            return res.status(200).json({ message: `'${itemNameToDelete}' removed from cart successfully.` });
        } else {
            return res.status(404).json({ message: `'${itemNameToDelete}' not found in cart or failed to remove.` });
        }
    } catch (error) {
        console.error("Error deleting item from cart:", error);
        res.status(500).json({ message: "Failed to remove item from cart.", error: error.message });
    }
};


module.exports = {
    getCartItems,
    addToCart,
    deleteCartItem // NEW: EXPORT THE deleteCartItem function
};