const pool = require('./db');

async function cleanDuplicates() {
    try {
        console.log('Cleaning up duplicate results...');
        
        // Find duplicate attempt_ids
        const [dups] = await pool.execute(`
            SELECT attempt_id, COUNT(*) as c 
            FROM results 
            GROUP BY attempt_id 
            HAVING c > 1
        `);
        
        for (const row of dups) {
            // Get all ids for this attempt_id, keep the first one
            const [ids] = await pool.execute(
                'SELECT id FROM results WHERE attempt_id = ? ORDER BY id ASC',
                [row.attempt_id]
            );
            
            // Delete all except the first one
            for (let i = 1; i < ids.length; i++) {
                await pool.execute('DELETE FROM results WHERE id = ?', [ids[i].id]);
            }
            console.log(`Cleaned up duplicate for attempt_id: ${row.attempt_id}`);
        }
        
        // Add unique constraint to prevent future races
        console.log('Adding unique constraint to results.attempt_id...');
        try {
            await pool.execute('ALTER TABLE results ADD CONSTRAINT unique_attempt UNIQUE(attempt_id)');
            console.log('Unique constraint added.');
        } catch (e) {
            if (e.code === 'ER_DUP_KEYNAME') console.log('Constraint already exists.');
            else console.log('Error adding constraint:', e);
        }

        console.log('Done cleaning!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanDuplicates();
