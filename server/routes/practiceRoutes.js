const express = require('express');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/practice/:subjectId
 * @desc    Get practice questions for a subject. Includes correct answers and explanations for instant feedback.
 */
router.get('/:subjectId', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const subjectId = req.params.subjectId;
        
        // Fetch a random set of questions (e.g. 10 questions) for practice
        const [questions] = await pool.execute(`
            SELECT q.id, q.content, q.option_a, q.option_b, q.option_c, q.option_d, q.type, 
                   q.correct_option, q.explanation, q.difficulty, t.name as topic_name
            FROM questions q
            JOIN topics t ON q.topic_id = t.id
            WHERE t.subject_id = ?
            ORDER BY RAND() LIMIT 15
        `, [subjectId]);

        res.json({
            message: 'Practice started',
            questions
        });
    } catch (error) {
        console.error('Error fetching practice questions:', error);
        res.status(500).json({ message: 'Server error fetching practice questions' });
    }
});

/**
 * @route   POST /api/practice/generate
 * @desc    Generate a custom practice test given subject, topic, and difficulty counts
 */
router.post('/generate', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const { topicId, easyCount = 0, mediumCount = 0, hardCount = 0 } = req.body;

        if (!topicId) {
            return res.status(400).json({ message: 'topicId is required' });
        }

        const fetchQuestions = async (diff, count) => {
            if (count > 0) {
                const [rows] = await pool.execute(`
                    SELECT q.id, q.content, q.option_a, q.option_b, q.option_c, q.option_d, q.type,
                           q.correct_option, q.explanation, q.difficulty, t.name as topic_name
                    FROM questions q
                    JOIN topics t ON q.topic_id = t.id
                    WHERE q.topic_id = ? AND q.difficulty = ?
                    ORDER BY RAND() LIMIT ${parseInt(count)}
                `, [topicId, diff]);
                return rows;
            }
            return [];
        };

        const [easyQs, mediumQs, hardQs] = await Promise.all([
            fetchQuestions('easy', easyCount),
            fetchQuestions('medium', mediumCount),
            fetchQuestions('hard', hardCount),
        ]);

        let questions = [...easyQs, ...mediumQs, ...hardQs];
        // Shuffle questions
        questions = questions.sort(() => 0.5 - Math.random());

        res.json({
            message: 'Practice test generated',
            questions
        });
    } catch (error) {
        console.error('Error generating custom practice questions:', error);
        res.status(500).json({ message: 'Server error generating practice test' });
    }
});

module.exports = router;
