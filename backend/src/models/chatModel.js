const pool = require('../config/db'); // Use the PostgreSQL pool

const Chat = {
    // Get messages between two specific users
    getMessagesBetweenUsers: async (userId1, userId2) => {
        try {
            // Select messages where sender is user1 and receiver is user2, OR vice versa
            const result = await pool.query(
                `SELECT id, sender_id, receiver_id, message_text, timestamp
                 FROM chat_messages
                 WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $3 AND receiver_id = $4)
                 ORDER BY timestamp ASC`,
                [userId1, userId2, userId2, userId1]
            );
            return result.rows; // pg returns rows in result.rows
        } catch (error) {
            console.error("Error fetching chat messages:", error);
            throw error;
        }
    },

    // Create a new message
    createMessage: async (senderId, receiverId, messageText) => {
        try {
            // Use RETURNING id to get the new ID for PostgreSQL
            const result = await pool.query(
                `INSERT INTO chat_messages (sender_id, receiver_id, message_text)
                 VALUES ($1, $2, $3) RETURNING id`,
                [senderId, receiverId, messageText]
            );
            return result.rows[0].id; // Get ID from rows
        } catch (error) {
            console.error("Error creating chat message:", error);
            throw error;
        }
    }
};

module.exports = Chat;