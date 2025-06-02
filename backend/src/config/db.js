require('dotenv').config(); // Still needed for local .env files

const { Pool } = require('pg'); // Import the PostgreSQL client

const pool = new Pool({
    // Render will provide DATABASE_URL. Locally, you can set it in .env
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Render's default SSL configuration
    }
});

// Optional: Test connection when the pool is created
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error acquiring PostgreSQL client:', err.stack);
        return;
    }
    client.query('SELECT NOW()', (err, result) => {
        release(); // Release the client back to the pool
        if (err) {
            console.error('Error executing test query:', err.stack);
            return;
        }
        console.log('Successfully connected to PostgreSQL:', result.rows[0].now);
    });
});

module.exports = pool;