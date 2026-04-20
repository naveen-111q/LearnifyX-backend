const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    let connection;
    try {
        console.log("Connecting to Database...");
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'exam_system'
        });

        console.log("Adding columns to users table...");
        
        const alterQueries = [
            "ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE users ADD COLUMN otp_code VARCHAR(6) NULL;",
            "ALTER TABLE users ADD COLUMN otp_expiry DATETIME NULL;",
            "ALTER TABLE users ADD COLUMN reset_otp_code VARCHAR(6) NULL;",
            "ALTER TABLE users ADD COLUMN reset_otp_expiry DATETIME NULL;"
        ];

        for (const query of alterQueries) {
            try {
                await connection.execute(query);
                console.log(`Executed: ${query}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists: ${query}`);
                } else {
                    console.error(`Error executing: ${query}`, err.message);
                }
            }
        }

        // Set all existing users to verified so they don't get locked out
        console.log("Setting existing users as verified...");
        await connection.execute("UPDATE users SET is_verified = TRUE");

        console.log("Migration complete!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (connection) {
            await connection.end();
        }
        process.exit();
    }
}

migrate();
