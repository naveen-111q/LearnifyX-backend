const express = require('express');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/topics/:topicId/questions
 * @desc    Get all questions for a topic (any teacher or student)
 */
router.get('/:topicId/questions', authenticateToken, async (req, res) => {
    try {
        const [questions] = await pool.execute('SELECT * FROM questions WHERE topic_id = ?', [req.params.topicId]);
        res.json(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Server error fetching questions' });
    }
});

/**
 * @route   POST /api/topics/:topicId/questions
 * @desc    Add a question to a topic (any teacher)
 */
router.post('/:topicId/questions', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const topicId = req.params.topicId;
        const { content, type, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation } = req.body;

        if (!content || !correct_option || !difficulty) {
            return res.status(400).json({ message: 'Content, correct option, and difficulty are required' });
        }

        const qType = type || 'mcq';

        const [result] = await pool.execute(
            `INSERT INTO questions 
            (topic_id, content, type, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [topicId, content, qType, option_a || null, option_b || null, option_c || null, option_d || null, correct_option, difficulty, explanation || '']
        );

        res.status(201).json({
            message: 'Question added successfully',
            question: { id: result.insertId, topic_id: topicId, content, type: qType, correct_option }
        });
    } catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({ message: 'Server error creating question' });
    }
});

/**
 * @route   PUT /api/topics/:topicId/questions/:qId
 * @desc    Update a question (any teacher)
 */
router.put('/:topicId/questions/:qId', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const { topicId, qId } = req.params;
        const { content, type, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation } = req.body;

        if (!content || !correct_option || !difficulty) {
            return res.status(400).json({ message: 'Content, correct option, and difficulty are required' });
        }

        const qType = type || 'mcq';

        await pool.execute(
            `UPDATE questions 
             SET content = ?, type = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_option = ?, difficulty = ?, explanation = ?
             WHERE id = ? AND topic_id = ?`,
            [content, qType, option_a || null, option_b || null, option_c || null, option_d || null, correct_option, difficulty, explanation || '', qId, topicId]
        );

        res.json({ message: 'Question updated successfully' });
    } catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ message: 'Server error updating question' });
    }
});

/**
 * @route   DELETE /api/topics/:topicId/questions/:qId
 * @desc    Delete a question (any teacher)
 */
router.delete('/:topicId/questions/:qId', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const { topicId, qId } = req.params;

        await pool.execute('DELETE FROM questions WHERE id = ? AND topic_id = ?', [qId, topicId]);

        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ message: 'Server error deleting question' });
    }
});

module.exports = router;

