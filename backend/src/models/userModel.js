const pool = require('../config/db'); // Use the PostgreSQL pool

class User {
    static async findByEmail(email) {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0]; // pg returns rows in result.rows
    }

    static async findById(id) {
        const result = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [id]);
        return result.rows[0]; // pg returns rows in result.rows
    }

    static async create(username, email, hashedPassword) {
        // Use RETURNING id to get the new ID for PostgreSQL
        const result = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
            [username, email, hashedPassword]
        );
        return result.rows[0].id; // Get ID from rows
    }
}

module.exports = User;