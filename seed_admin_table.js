require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'exam_system',
        ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true
        } : null
    };

    let connection;
    try {
        console.log("Using DB Config:", { ...config, password: '***' });
        connection = await mysql.createConnection(config);
        console.log("Connected to database.");

        const adminEmail = 'srmap2026@gmail.com';
        const adminId = 'SRMAP2026';
        const adminPassword = 'naveen';
        
        console.log(`Generating hash for password: '${adminPassword}'...`);
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        console.log("Generated hash:", hashedPassword);

        // Verification check
        const isMatch = await bcrypt.compare(adminPassword, hashedPassword);
        if (!isMatch) {
            throw new Error("Self-verification failed: Generated hash does not match original password!");
        }
        console.log("Verification successful: Hash matches password.");

        // 0. Ensure admin table exists
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admin (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id VARCHAR(50) UNIQUE NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Ensured 'admin' table exists.");

        // 1. Remove admin users from general users table (to ensure separation)
        await connection.execute("DELETE FROM users WHERE role = 'admin'");
        console.log("Deleted any existing admins from 'users' table.");

        // 2. Insert or update the dedicated admin table
        await connection.execute("DELETE FROM admin WHERE email = ? OR admin_id = ?", [adminEmail, adminId]);
        await connection.execute(
            "INSERT INTO admin (admin_id, email, password_hash) VALUES (?, ?, ?)",
            [adminId, adminEmail, hashedPassword]
        );
        console.log(`Dedicated admin '${adminId}' set up successfully in 'admin' table.`);

        process.exit(0);
    } catch (err) {
        console.error("Error seeding admin table:", err.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

seedAdmin();
