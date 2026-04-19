const express = require('express');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/exams
 * @desc    Get exams (Shared)
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'teacher') {
            // All teachers see all exams
            const [exams] = await pool.execute(`
                SELECT e.*, s.name as subject_name, u.name as teacher_name
                FROM exams e
                LEFT JOIN subjects s ON e.subject_id = s.id
                LEFT JOIN users u ON e.teacher_id = u.id
            `);
            return res.json(exams);
        } else {
            // Dynamically fetch the section directly from db for robustness against old tokens
            const [users] = await pool.execute('SELECT section FROM users WHERE id = ?', [req.user.id]);
            const studentSection = users[0]?.section || 'None';

            const [exams] = await pool.execute(`
                SELECT e.*, s.name as subject_name, ea.status as attempt_status 
                FROM exams e
                JOIN subjects s ON e.subject_id = s.id
                LEFT JOIN exam_attempts ea ON e.id = ea.exam_id AND ea.student_id = ?
                WHERE e.status = 'published' 
                  AND (e.allowed_section = '' OR e.allowed_section IS NULL OR e.allowed_section = ?)
            `, [req.user.id, studentSection]);
            return res.json(exams);
        }
    } catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).json({ message: 'Server error fetching exams' });
    }
});

// ==========================================
// STUDENT ROUTES (PLACE ABOVE GREEDY ID ROUTES)
// ==========================================

/**
 * @route   GET /api/exams/student/results
 * @desc    Fetch a student's final exam results
 */
router.get('/student/results', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const [results] = await pool.execute(`
            SELECT 
                r.attempt_id,
                r.total_score, 
                ea.end_time, 
                e.title as exam_title, 
                e.total_marks,
                s.name as subject_name
            FROM results r
            JOIN exam_attempts ea ON r.attempt_id = ea.id
            JOIN exams e ON ea.exam_id = e.id
            JOIN subjects s ON e.subject_id = s.id
            WHERE r.student_id = ?
            ORDER BY ea.end_time DESC
        `, [req.user.id]);
        res.json(results);
    } catch (error) {
        console.error('Error fetching student results:', error);
        res.status(500).json({ message: 'Server error fetching results' });
    }
});

/**
 * @route   POST /api/exams/attempt/:attemptId/save
 */
router.post('/attempt/:attemptId/save', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const { question_id, selected_option, text_answer } = req.body;
        const attemptId = req.params.attemptId;

        const [attempt] = await pool.execute('SELECT * FROM exam_attempts WHERE id = ? AND student_id = ?', [attemptId, req.user.id]);
        if (attempt.length === 0 || attempt[0].status !== 'inprogress') {
            return res.status(403).json({ message: 'Invalid or completed attempt' });
        }

        const [existing] = await pool.execute('SELECT id FROM answers WHERE attempt_id = ? AND question_id = ?', [attemptId, question_id]);
        
        if (existing.length > 0) {
            await pool.execute('UPDATE answers SET selected_option = ?, text_answer = ? WHERE id = ?', [selected_option || null, text_answer || null, existing[0].id]);
        } else {
            await pool.execute(
                'INSERT INTO answers (attempt_id, question_id, selected_option, text_answer) VALUES (?, ?, ?, ?)',
                [attemptId, question_id, selected_option || null, text_answer || null]
            );
        }
        res.json({ message: 'Answer saved' });
    } catch (error) {
        console.error('Error saving answer:', error);
        res.status(500).json({ message: 'Server error saving answer' });
    }
});

/**
 * @route   POST /api/exams/attempt/:attemptId/submit
 */
router.post('/attempt/:attemptId/submit', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const attemptId = req.params.attemptId;

        const [attempt] = await pool.execute('SELECT status FROM exam_attempts WHERE id = ?', [attemptId]);
        if (!attempt.length || attempt[0].status === 'completed') {
            return res.status(400).json({ message: 'Exam already submitted or invalid attempt' });
        }

        const [answers] = await pool.execute('SELECT * FROM answers WHERE attempt_id = ?', [attemptId]);
        let totalScore = 0;

        for (const ans of answers) {
            if (!ans.selected_option && !ans.text_answer) continue;
            const [qRes] = await pool.execute('SELECT type, correct_option, text_answer, marks FROM exam_questions WHERE id = ?', [ans.question_id]);
            const q = qRes[0];
            if (!q) continue;

            let isCorrect = false;
            if (q.type === 'mcq' || q.type === 'tf' || q.type === 'true_false') {
                // Trim + lowercase both sides to handle any casing differences
                const studentAns = (ans.selected_option || '').trim().toLowerCase();
                const correctAns = (q.correct_option || '').trim().toLowerCase();
                isCorrect = studentAns !== '' && studentAns === correctAns;
            } else if (q.type === 'fib') {
                const stdAns = (ans.text_answer || '').trim().toLowerCase();
                const correctAns = (q.text_answer || '').trim().toLowerCase();
                isCorrect = stdAns === correctAns && stdAns !== '';
            }

            if (isCorrect) totalScore += q.marks;
            await pool.execute('UPDATE answers SET is_correct = ? WHERE id = ?', [isCorrect, ans.id]);
        }

        await pool.execute(
            "UPDATE exam_attempts SET end_time = CURRENT_TIMESTAMP, status = 'completed', score = ? WHERE id = ?",
            [totalScore, attemptId]
        );

        const [attemptInfo] = await pool.execute('SELECT student_id FROM exam_attempts WHERE id = ?', [attemptId]);
        await pool.execute(
            'INSERT INTO results (attempt_id, student_id, total_score) VALUES (?, ?, ?)',
            [attemptId, attemptInfo[0].student_id, totalScore]
        );

        // Clear reschedule flag now that student has retaken the exam
        const [examRow] = await pool.execute('SELECT exam_id FROM exam_attempts WHERE id = ?', [attemptId]);
        if (examRow.length > 0) {
            await pool.execute(
                'DELETE FROM exam_reschedules WHERE exam_id = ? AND student_id = ?',
                [examRow[0].exam_id, attemptInfo[0].student_id]
            );
        }

        // Fetch total marks to return to frontend
        const [examData] = await pool.execute('SELECT total_marks FROM exams WHERE id = ?', [examRow[0].exam_id]);
        const totalMarks = examData[0]?.total_marks || 0;

        res.json({ message: 'Exam submitted successfully', score: totalScore, totalMarks });
    } catch (error) {
        console.error('Error submitting exam:', error);
        res.status(500).json({ message: 'Server error submitting exam' });
    }
});

/**
 * @route   POST /api/exams/:id/attempt
 */
router.post('/:id/attempt', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const [existingAttempt] = await pool.execute(
            'SELECT * FROM exam_attempts WHERE exam_id = ? AND student_id = ? ORDER BY id DESC LIMIT 1',
            [req.params.id, req.user.id]
        );

        // If already COMPLETED, block
        if (existingAttempt.length > 0 && existingAttempt[0].status === 'completed') {
            return res.status(403).json({ message: 'You have already completed this exam.' });
        }

        // If in-progress (e.g. page refresh or React StrictMode double-fire), RESUME it
        if (existingAttempt.length > 0 && existingAttempt[0].status === 'inprogress') {
            const attemptId = existingAttempt[0].id;
            const [exam] = await pool.execute('SELECT subject_id, total_marks, exam_date, start_time, end_time FROM exams WHERE id = ?', [req.params.id]);
            if (exam.length === 0) return res.status(404).json({ message: 'Exam not found' });
            const [finalQuestions] = await pool.execute(
                'SELECT id, type, content, option_a, option_b, option_c, option_d, marks FROM exam_questions WHERE exam_id = ?',
                [req.params.id]
            );
            const normalizeT = (t) => {
                if (typeof t === 'string') return t.substring(0, 8);
                if (t && typeof t === 'object' && 'hours' in t) return String(t.hours).padStart(2,'0')+':'+String(t.minutes||0).padStart(2,'0')+':00';
                return String(t);
            };
            const ns = normalizeT(exam[0].start_time);
            const ne = normalizeT(exam[0].end_time);
            const [sh, sm] = ns.split(':').map(Number);
            const [eh, em] = ne.split(':').map(Number);
            const dur = (eh*60+em) - (sh*60+sm);
            return res.json({
                message: 'Exam resumed',
                attemptId,
                exam: { duration_minutes: dur > 0 ? dur : 60, end_time: ne },
                questions: finalQuestions
            });
        }

        const [exam] = await pool.execute('SELECT subject_id, total_marks, exam_date, start_time, end_time FROM exams WHERE id = ?', [req.params.id]);
        if (exam.length === 0) return res.status(404).json({ message: 'Exam not found' });
        
        // Check if this student has a personal rescheduled window
        const [rescheduleRow] = await pool.execute(
            "SELECT DATE_FORMAT(exam_date, '%Y-%m-%d') as exam_date, start_time, end_time FROM exam_reschedules WHERE exam_id = ? AND student_id = ?",
            [req.params.id, req.user.id]
        );

        // Get current date/time in server's local timezone as strings for safe comparison
        const nowLocal = new Date();
        const localDateStr = nowLocal.getFullYear() + '-' +
            String(nowLocal.getMonth() + 1).padStart(2, '0') + '-' +
            String(nowLocal.getDate()).padStart(2, '0');
        const localTimeStr = String(nowLocal.getHours()).padStart(2, '0') + ':' +
            String(nowLocal.getMinutes()).padStart(2, '0') + ':' +
            String(nowLocal.getSeconds()).padStart(2, '0');

        // Normalize startTime/endTime: MySQL TIME columns can return "HH:MM:SS" or duration objects
        const normalizeTime = (t) => {
            if (typeof t === 'string') return t.substring(0, 8); // trim to HH:MM:SS
            if (t && typeof t === 'object' && 'hours' in t) {
                // MySQL duration object
                return String(t.hours).padStart(2, '0') + ':' +
                    String(t.minutes || 0).padStart(2, '0') + ':' +
                    String(t.seconds || 0).padStart(2, '0');
            }
            return String(t);
        };

        // Helper to normalize a MySQL date (can be JS Date object or string) to YYYY-MM-DD
        const normalizeDate = (d) => {
            if (!d) return '';
            if (d instanceof Date) {
                // Use LOCAL date parts to avoid UTC-shift changing the date
                return d.getFullYear() + '-' +
                    String(d.getMonth() + 1).padStart(2, '0') + '-' +
                    String(d.getDate()).padStart(2, '0');
            }
            // Already a string like "2026-04-19" or "2026-04-19T..."
            return String(d).substring(0, 10);
        };

        let examDateStr, startTime, endTime;
        if (rescheduleRow.length > 0) {
            examDateStr = normalizeDate(rescheduleRow[0].exam_date);
            startTime   = rescheduleRow[0].start_time;
            endTime     = rescheduleRow[0].end_time;
        } else {
            const [examDataRow] = await pool.execute(
                'SELECT exam_date, start_time, end_time FROM exams WHERE id = ?',
                [req.params.id]
            );
            examDateStr = normalizeDate(examDataRow[0].exam_date);
            startTime   = examDataRow[0].start_time;
            endTime     = examDataRow[0].end_time;
        }

        const normStart = normalizeTime(startTime);
        const normEnd   = normalizeTime(endTime);

        // Compare date+time as sortable strings "YYYY-MM-DD HH:MM:SS"
        const nowDT   = `${localDateStr} ${localTimeStr}`;
        const startDT = `${examDateStr} ${normStart}`;
        const endDT   = `${examDateStr} ${normEnd}`;

        console.log(`[Exam Check] Student: ${req.user.id}, Exam: ${req.params.id}`);
        console.log(`[Exam Check] Now (local): ${nowDT}`);
        console.log(`[Exam Check] Window: ${startDT} → ${endDT}`);

        if (nowDT < startDT) return res.status(403).json({ message: `Exam has not started yet. It starts at ${normStart} on ${examDateStr}.` });
        if (nowDT > endDT)   return res.status(403).json({ message: `Exam window has closed. It ended at ${normEnd} on ${examDateStr}.` });

        const [result] = await pool.execute(
            "INSERT INTO exam_attempts (exam_id, student_id, status) VALUES (?, ?, 'inprogress')",
            [req.params.id, req.user.id]
        );
        const attemptId = result.insertId;

        const [finalQuestions] = await pool.execute(`
            SELECT id, type, content, option_a, option_b, option_c, option_d, marks 
            FROM exam_questions
            WHERE exam_id = ?
        `, [req.params.id]);

        // Calculate duration from normalized time strings
        const [startH, startM] = normStart.split(':').map(Number);
        const [endH, endM] = normEnd.split(':').map(Number);
        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

        res.json({
            message: 'Exam started',
            attemptId,
            exam: { duration_minutes: durationMinutes > 0 ? durationMinutes : 60, end_time: normEnd, exam_date: examDateStr },
            questions: finalQuestions
        });
    } catch (error) {
        console.error('Error starting exam:', error);
        res.status(500).json({ message: 'Server error starting exam' });
    }
});

// ==========================================
// TEACHER ROUTES
// ==========================================

router.post('/', authenticateToken, requireRole('teacher'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { subject_id, title, exam_date, start_time, end_time, questions, allowed_section } = req.body;
        await connection.beginTransaction();
        const totalMarks = questions.reduce((sum, q) => sum + parseInt(q.marks || 1), 0);
        const [result] = await connection.execute(
            `INSERT INTO exams (subject_id, teacher_id, title, exam_date, start_time, end_time, total_marks, status, allowed_section) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
            [subject_id, req.user.id, title, exam_date, start_time, end_time, totalMarks, allowed_section || '']
        );
        const examId = result.insertId;
        for (const q of questions) {
            await connection.execute(
                `INSERT INTO exam_questions (exam_id, type, text_answer, content, option_a, option_b, option_c, option_d, correct_option, marks)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [examId, q.type || 'mcq', q.text_answer || null, q.content, q.option_a || null, q.option_b || null, q.option_c || null, q.option_d || null, q.correct_option || null, q.marks || 1]
            );
        }
        await connection.commit();
        res.status(201).json({ message: 'Exam created successfully', exam: { id: examId, title, status: 'draft' } });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating exam:', error);
        res.status(500).json({ message: 'Server error creating exam' });
    } finally {
        connection.release();
    }
});

router.post('/:id/publish', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        await pool.execute("UPDATE exams SET status = 'published' WHERE id = ?", [req.params.id]);
        res.json({ message: 'Exam published successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error publishing exam' });
    }
});

router.get('/:id', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const [exam] = await pool.execute('SELECT * FROM exams WHERE id = ?', [req.params.id]);
        if (exam.length === 0) return res.status(404).json({ message: 'Exam not found' });
        const [questions] = await pool.execute('SELECT * FROM exam_questions WHERE exam_id = ?', [req.params.id]);
        res.json({ ...exam[0], questions });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching exam' });
    }
});

router.put('/:id', authenticateToken, requireRole('teacher'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { subject_id, title, exam_date, start_time, end_time, questions, allowed_section } = req.body;
        await connection.beginTransaction();
        const totalMarks = questions.reduce((sum, q) => sum + parseInt(q.marks || 1), 0);
        await connection.execute(
            `UPDATE exams SET subject_id=?, title=?, exam_date=?, start_time=?, end_time=?, total_marks=?, allowed_section=? WHERE id=?`,
            [subject_id, title, exam_date, start_time, end_time, totalMarks, allowed_section || '', id]
        );
        await connection.execute('DELETE FROM exam_attempts WHERE exam_id = ?', [id]);
        await connection.execute('DELETE FROM exam_questions WHERE exam_id = ?', [id]);
        for (const q of questions) {
            await connection.execute(
                `INSERT INTO exam_questions (exam_id, type, text_answer, content, option_a, option_b, option_c, option_d, correct_option, marks)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, q.type || 'mcq', q.text_answer || null, q.content, q.option_a || null, q.option_b || null, q.option_c || null, q.option_d || null, q.correct_option || null, q.marks || 1]
            );
        }
        await connection.commit();
        res.json({ message: 'Exam updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating exam:', error);
        res.status(500).json({ message: 'Server error updating exam' });
    } finally {
        connection.release();
    }
});

router.delete('/:id', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const [exam] = await pool.execute('SELECT * FROM exams WHERE id = ?', [req.params.id]);
        if (exam.length === 0) return res.status(404).json({ message: 'Exam not found' });

        await pool.execute('DELETE FROM exams WHERE id = ?', [req.params.id]);
        res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        console.error('Error deleting exam:', error);
        res.status(500).json({ message: 'Server error deleting exam' });
    }
});

router.get('/:id/results', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const [examInfo] = await pool.execute('SELECT title, allowed_section, total_marks FROM exams WHERE id = ?', [req.params.id]);
        if (examInfo.length === 0) return res.status(404).json({ message: 'Exam not found' });
        const exam = examInfo[0];

        let query = `
            SELECT 
                u.id as student_id,
                u.name,
                u.section,
                best.attempt_status,
                best.total_score,
                CASE WHEN er.student_id IS NOT NULL THEN 1 ELSE 0 END as is_rescheduled
            FROM users u
            LEFT JOIN (
                SELECT 
                    ea.student_id,
                    ea.status as attempt_status,
                    r.total_score,
                    ROW_NUMBER() OVER (
                        PARTITION BY ea.student_id 
                        ORDER BY 
                            CASE ea.status WHEN 'completed' THEN 0 ELSE 1 END ASC,
                            r.total_score DESC,
                            ea.id DESC
                    ) as rn
                FROM exam_attempts ea
                LEFT JOIN results r ON ea.id = r.attempt_id
                WHERE ea.exam_id = ?
            ) best ON u.id = best.student_id AND best.rn = 1
            LEFT JOIN exam_reschedules er ON u.id = er.student_id AND er.exam_id = ?
            WHERE u.role = 'student' AND u.is_verified = TRUE
        `;
        const queryParams = [req.params.id, req.params.id];

        if (exam.allowed_section && exam.allowed_section.trim() !== '') {
            query += ' AND u.section = ?';
            queryParams.push(exam.allowed_section.trim());
        }

        query += ' ORDER BY u.name ASC';

        const [studentResults] = await pool.execute(query, queryParams);

        res.json({ exam: exam.title, totalMarks: exam.total_marks, results: studentResults });
    } catch (error) {
        console.error('Error fetching exam results:', error);
        res.status(500).json({ message: 'Server error fetching results' });
    }
});

/**
 * @route   POST /api/exams/:examId/reschedule/:studentId
 * @desc    Reset a specific student's exam attempt with a custom time window
 */
router.post('/:examId/reschedule/:studentId', authenticateToken, requireRole('teacher'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { examId, studentId } = req.params;
        const { exam_date, start_time, end_time } = req.body;

        if (!exam_date || !start_time || !end_time) {
            return res.status(400).json({ message: 'exam_date, start_time, and end_time are required.' });
        }

        // Verify exam exists (any teacher can reschedule)
        const [exam] = await connection.execute('SELECT id FROM exams WHERE id = ?', [examId]);
        if (exam.length === 0) return res.status(404).json({ message: 'Exam not found' });

        // Delete previous attempt answers and result
        const [attempts] = await connection.execute('SELECT id FROM exam_attempts WHERE exam_id = ? AND student_id = ?', [examId, studentId]);
        for (const attempt of attempts) {
            await connection.execute('DELETE FROM answers WHERE attempt_id = ?', [attempt.id]);
            await connection.execute('DELETE FROM results WHERE attempt_id = ?', [attempt.id]);
        }
        await connection.execute('DELETE FROM exam_attempts WHERE exam_id = ? AND student_id = ?', [examId, studentId]);

        // Mark student as rescheduled with the custom time window
        await connection.execute(
            `INSERT INTO exam_reschedules (exam_id, student_id, exam_date, start_time, end_time) 
             VALUES (?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE rescheduled_at = CURRENT_TIMESTAMP, exam_date = VALUES(exam_date), start_time = VALUES(start_time), end_time = VALUES(end_time)`,
            [examId, studentId, exam_date, start_time, end_time]
        );

        res.json({ message: 'Exam rescheduled for this student with a custom time window.' });
    } catch (error) {
        console.error('Error rescheduling exam:', error);
        res.status(500).json({ message: 'Server error rescheduling exam' });
    } finally {
        connection.release();
    }
});

module.exports = router;

