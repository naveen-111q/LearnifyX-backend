const pool = require('./db');

async function checkSchema() {
    try {
        const [rows] = await pool.query("DESCRIBE users;");
        console.log(rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkSchema();
