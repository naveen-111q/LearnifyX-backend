require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function initDB() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log("Connected to MySQL server.");
        
        const schema = fs.readFileSync('./schema.sql', 'utf8');
        
        await connection.query(schema);
        console.log("Database initialized successfully!");
        
        await connection.end();
    } catch (err) {
        console.error("Error initializing DB:", err.message);
    }
}

initDB();
