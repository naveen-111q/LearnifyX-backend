const express = require('express');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/topics/:topicId/materials
 * @desc    Get all materials for a specific topic (any teacher or student)
 */
router.get('/:topicId/materials', authenticateToken, async (req, res) => {
    try {
        const [materials] = await pool.execute(
            'SELECT * FROM materials WHERE topic_id = ?',
            [req.params.topicId]
        );
        res.json(materials);
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({ message: 'Server error fetching materials' });
    }
});

/**
 * @route   POST /api/topics/:topicId/materials
 * @desc    Add a material to a topic (any teacher)
 */
router.post('/:topicId/materials', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const topicId = req.params.topicId;
        const { type, content_url, title } = req.body;

        if (!type || !content_url || !title) {
            return res.status(400).json({ message: 'Type, content_url, and title are required' });
        }
        
        if (!['pdf', 'link', 'notes'].includes(type)) {
            return res.status(400).json({ message: 'Invalid material type' });
        }

        const [result] = await pool.execute(
            'INSERT INTO materials (topic_id, type, content_url, title) VALUES (?, ?, ?, ?)',
            [topicId, type, content_url, title]
        );

        res.status(201).json({
            message: 'Material added successfully',
            material: { id: result.insertId, topic_id: topicId, type, content_url, title }
        });
    } catch (error) {
        console.error('Error creating material:', error);
        res.status(500).json({ message: 'Server error creating material' });
    }
});

/**
 * @route   DELETE /api/topics/:topicId/materials/:materialId
 * @desc    Delete a material (any teacher)
 */
router.delete('/:topicId/materials/:materialId', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const { topicId, materialId } = req.params;

        await pool.execute('DELETE FROM materials WHERE id = ? AND topic_id = ?', [materialId, topicId]);

        res.json({ message: 'Material deleted successfully' });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({ message: 'Server error deleting material' });
    }
});

module.exports = router;
