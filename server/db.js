require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 4000,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'exam_system',
    ssl: (process.env.DB_HOST && process.env.DB_HOST !== 'localhost') ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    } : null,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log("MySQL Database Connected successfully");
        connection.release();
    } catch (error) {
        console.error("MySQL connection error:", error.message);
    }
}

testConnection();

module.exports = pool;
