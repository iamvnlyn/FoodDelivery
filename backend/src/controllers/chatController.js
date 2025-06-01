const Chat = require('../models/chatModel');

// Controller to get chat history for a specific user with the owner
exports.getChatHistory = async (req, res) => {
    try {
        const customerId = req.user.id; // Authenticated customer's ID
        const ownerId = parseInt(req.params.ownerId); // Owner's ID from URL parameter

        if (isNaN(ownerId)) {
            return res.status(400).json({ message: "Invalid owner ID." });
        }

        const messages = await Chat.getMessagesBetweenUsers(customerId, ownerId);
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getChatHistory:", error);
        res.status(500).json({ message: "Failed to retrieve chat history.", error: error.message });
    }
};

// Controller to send a new message
exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id; // Authenticated sender's ID
        const { receiverId, messageText } = req.body;

        if (!receiverId || !messageText) {
            return res.status(400).json({ message: "Receiver ID and message text are required." });
        }

        const messageId = await Chat.createMessage(senderId, receiverId, messageText);
        res.status(201).json({ message: "Message sent successfully!", messageId });
    } catch (error) {
        console.error("Error in sendMessage:", error);
        res.status(500).json({ message: "Failed to send message.", error: error.message });
    }
};
