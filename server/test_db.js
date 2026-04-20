const pool = require('./db');

async function fix() {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS chat_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                topic_id INT,
                role ENUM('user', 'assistant') NOT NULL,
                message TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
            )
        `);
        console.log("chat_history table created successfully!");
    } catch(e) {
        console.error("DB Error:", e.message);
    } finally {
        process.exit();
    }
}
fix();
