const pool = require('../config/db');

const Chat = {
    // Get messages between two specific users
    getMessagesBetweenUsers: async (userId1, userId2) => {
        try {
            // Select messages where sender is user1 and receiver is user2, OR vice versa
            const [rows] = await pool.execute(
                `SELECT id, sender_id, receiver_id, message_text, timestamp
                 FROM chat_messages
                 WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
                 ORDER BY timestamp ASC`,
                [userId1, userId2, userId2, userId1]
            );
            return rows;
        } catch (error) {
            console.error("Error fetching chat messages:", error);
            throw error;
        }
    },

    // Create a new message
    createMessage: async (senderId, receiverId, messageText) => {
        try {
            const [result] = await pool.execute(
                `INSERT INTO chat_messages (sender_id, receiver_id, message_text)
                 VALUES (?, ?, ?)`,
                [senderId, receiverId, messageText]
            );
            return result.insertId;
        } catch (error) {
            console.error("Error creating chat message:", error);
            throw error;
        }
    }
};

module.exports = Chat;
