const pool = require('./db');
async function run() {
    try {
        await pool.execute(`ALTER TABLE exam_reschedules 
            ADD COLUMN exam_date DATE NULL,
            ADD COLUMN start_time TIME NULL,
            ADD COLUMN end_time TIME NULL`);
        console.log('Columns added successfully');
    } catch(e) {
        console.error('Error:', e.message);
    }
    pool.end();
}
run();
