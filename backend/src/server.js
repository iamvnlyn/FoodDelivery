const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: 'https://food-delivery-red-ten.vercel.app' 
}));

app.use(express.json()); // Parse JSON request bodies

// Routes
app.use('/auth', authRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/products', productRoutes);
app.use('/chat', chatRoutes);
console.log('--- Chat routes mounted at /api/chat in server.js ---'); // <--- PLACE THIS RIGHT AFTER app.use('/api/chat', chatRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Food Delivery API is running!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});