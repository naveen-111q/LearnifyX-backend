const express = require('express');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/subjects
 * @desc    Get all subjects for the current user
 *          - If Teacher: gets subjects taught by them
 *          - If Student: gets all available subjects (or enrolled subjects, we'll return all for now)
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Both teachers and students see all subjects
        const [subjects] = await pool.execute(`
            SELECT s.*, u.name as teacher_name 
            FROM subjects s 
            LEFT JOIN users u ON s.teacher_id = u.id
        `);
        return res.json(subjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: 'Server error fetching subjects' });
    }
});

/**
 * @route   POST /api/subjects
 * @desc    Create a new subject (Teacher only)
 */
router.post('/', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ message: 'Subject name is required' });

        const [result] = await pool.execute(
            'INSERT INTO subjects (name, description, teacher_id) VALUES (?, ?, ?)',
            [name, description || '', req.user.id]
        );

        res.status(201).json({
            message: 'Subject created successfully',
            subject: { id: result.insertId, name, description, teacher_id: req.user.id }
        });
    } catch (error) {
        console.error('Error creating subject:', error);
        res.status(500).json({ message: 'Server error creating subject' });
    }
});

/**
 * @route   PUT /api/subjects/:id
 * @desc    Update a subject (Teacher only)
 */
router.put('/:id', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ message: 'Subject name is required' });

        const [subjects] = await pool.execute('SELECT id FROM subjects WHERE id = ?', [req.params.id]);
        if (subjects.length === 0) return res.status(404).json({ message: 'Subject not found' });

        await pool.execute(
            'UPDATE subjects SET name = ?, description = ? WHERE id = ?',
            [name, description || '', req.params.id]
        );

        res.json({ message: 'Subject updated successfully' });
    } catch (error) {
        console.error('Error updating subject:', error);
        res.status(500).json({ message: 'Server error updating subject' });
    }
});

/**
 * @route   GET /api/subjects/:id/topics
 * @desc    Get all topics for a specific subject
 */
router.get('/:id/topics', authenticateToken, async (req, res) => {
    try {
         const [topics] = await pool.execute('SELECT * FROM topics WHERE subject_id = ?', [req.params.id]);
         res.json(topics);
    } catch (error) {
         console.error('Error fetching topics:', error);
         res.status(500).json({ message: 'Server error fetching topics' });
    }
});

/**
 * @route   POST /api/subjects/:id/topics
 * @desc    Create a new topic for a subject (Teacher only)
 */
router.post('/:id/topics', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const subjectId = req.params.id;
        const { name, description } = req.body;
        
        if (!name) return res.status(400).json({ message: 'Topic name is required' });

        const [subjects] = await pool.execute('SELECT id FROM subjects WHERE id = ?', [subjectId]);
        if (subjects.length === 0) return res.status(404).json({ message: 'Subject not found' });

        const [result] = await pool.execute(
            'INSERT INTO topics (subject_id, name, description) VALUES (?, ?, ?)',
            [subjectId, name, description || '']
        );

        res.status(201).json({
            message: 'Topic created successfully',
            topic: { id: result.insertId, subject_id: subjectId, name, description }
        });
    } catch (error) {
        console.error('Error creating topic:', error);
        res.status(500).json({ message: 'Server error creating topic' });
    }
});

/**
 * @route   PUT /api/subjects/:id/topics/:topicId
 * @desc    Update a topic for a subject (Teacher only)
 */
router.put('/:id/topics/:topicId', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const { id: subjectId, topicId } = req.params;
        const { name, description } = req.body;
        
        if (!name) return res.status(400).json({ message: 'Topic name is required' });

        const [subjects] = await pool.execute('SELECT id FROM subjects WHERE id = ?', [subjectId]);
        if (subjects.length === 0) return res.status(404).json({ message: 'Subject not found' });

        await pool.execute(
            'UPDATE topics SET name = ?, description = ? WHERE id = ? AND subject_id = ?',
            [name, description || '', topicId, subjectId]
        );

        res.json({ message: 'Topic updated successfully' });
    } catch (error) {
        console.error('Error updating topic:', error);
        res.status(500).json({ message: 'Server error updating topic' });
    }
});

/**
 * @route   DELETE /api/subjects/:id
 * @desc    Delete a subject (Teacher only)
 */
router.delete('/:id', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const subjectId = req.params.id;

        const [subjects] = await pool.execute('SELECT id FROM subjects WHERE id = ?', [subjectId]);
        if (subjects.length === 0) return res.status(404).json({ message: 'Subject not found' });

        await pool.execute('DELETE FROM subjects WHERE id = ?', [subjectId]);
        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        console.error('Error deleting subject:', error);
        res.status(500).json({ message: 'Server error deleting subject' });
    }
});

/**
 * @route   DELETE /api/subjects/:id/topics/:topicId
 * @desc    Delete a topic for a subject (Teacher only)
 */
router.delete('/:id/topics/:topicId', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const { id: subjectId, topicId } = req.params;

        const [subjects] = await pool.execute('SELECT id FROM subjects WHERE id = ?', [subjectId]);
        if (subjects.length === 0) return res.status(404).json({ message: 'Subject not found' });

        await pool.execute('DELETE FROM topics WHERE id = ? AND subject_id = ?', [topicId, subjectId]);
        res.json({ message: 'Topic deleted successfully' });
    } catch (error) {
        console.error('Error deleting topic:', error);
        res.status(500).json({ message: 'Server error deleting topic' });
    }
});

module.exports = router;
