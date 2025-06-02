const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
require('dotenv').config();

const register = async (req, res) => {
    const { username, email, password } = req.body;
    // Corrected validation: Check if username, email, OR password is NOT provided (falsy/empty)
    if (!username || !email || !password) { // <--- CHANGE THIS LINE
        return res.status(400).json({ message: "All fields are required." });
    }
    try {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: "Email already registered." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = await User.create(username, email, hashedPassword);
        res.status(201).json({ message: "User registered successfully!", userId });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error during registration.", error: error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }
    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ message: "User not found.", suggestion: "Please check your email or sign up." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password.", suggestion: "Click 'Forgot Password' to reset." });
        }
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.status(200).json({
            message: "Login successful!",
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error during login.", error: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error fetching profile.' });
    }
};

const getMe = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated or ID missing from token.' });
        }
        res.status(200).json({ id: req.user.id, username: req.user.username });
    } catch (error) {
        console.error('Error fetching user details (getMe):', error);
        res.status(500).json({ message: 'Failed to retrieve user details.', error: error.message });
    }
};

console.log('authController - getMe is:', typeof getMe); 

module.exports = {
    register,
    login,
    getUserProfile,
    getMe 
};