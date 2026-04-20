const pool = require('./db');

async function alterDb() {
    try {
        // 1. Make exam_questions.correct_option nullable + expand ENUM to include True/False
        console.log("Altering exam_questions.correct_option ...");
        try {
            await pool.execute(
                "ALTER TABLE exam_questions MODIFY correct_option ENUM('A','B','C','D','True','False') NULL"
            );
            console.log("exam_questions.correct_option updated.");
        } catch(e) { console.error("exam_questions alter failed:", e.message); }

        // 2. Make answers.selected_option accept True/False for TF questions
        console.log("Altering answers.selected_option ...");
        try {
            await pool.execute(
                "ALTER TABLE answers MODIFY selected_option ENUM('A','B','C','D','True','False') NULL"
            );
            console.log("answers.selected_option updated.");
        } catch(e) { console.error("answers alter failed:", e.message); }

        console.log("Done.");
    } catch(err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
alterDb();
