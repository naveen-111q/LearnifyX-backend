const express = require('express');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all teachers
router.get('/teachers', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const [teachers] = await pool.execute(
            'SELECT id, name, email, is_verified, is_approved, section, created_at FROM users WHERE role = ? AND is_verified = TRUE ORDER BY created_at DESC',
            ['teacher']
        );
        res.json(teachers);
    } catch (error) {
        console.error("Fetch teachers error:", error);
        res.status(500).json({ message: "Server error fetching teachers" });
    }
});

// Get all students
router.get('/students', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const [students] = await pool.execute(
            'SELECT id, name, email, is_verified, section, created_at FROM users WHERE role = ? AND is_verified = TRUE ORDER BY created_at DESC',
            ['student']
        );
        res.json(students);
    } catch (error) {
        console.error("Fetch students error:", error);
        res.status(500).json({ message: "Server error fetching students" });
    }
});

// Update teacher approval status
router.put('/verify-teacher', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { teacherId, isApproved } = req.body;

        if (teacherId === undefined || isApproved === undefined) {
            return res.status(400).json({ message: "teacherId and isApproved are required" });
        }

        await pool.execute(
            'UPDATE users SET is_approved = ? WHERE id = ? AND role = ?',
            [isApproved, teacherId, 'teacher']
        );

        res.json({ message: `Teacher ${isApproved ? 'approved' : 'unapproved'} successfully` });
    } catch (error) {
        console.error("Verify teacher error:", error);
        res.status(500).json({ message: "Server error updating teacher status" });
    }
});

// Admin stats summary
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_verified = TRUE) as studentCount,
                (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND is_verified = TRUE AND is_approved = TRUE) as approvedTeacherCount,
                (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND is_verified = TRUE AND is_approved = FALSE) as pendingTeacherCount,
                (SELECT COUNT(*) FROM exams) as examCount
        `);
        res.json(stats[0]);
    } catch (error) {
        console.error("Admin stats error:", error);
        res.status(500).json({ message: "Server error fetching stats" });
    }
});

// Delete user account (Universal)
router.delete('/user/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const [user] = await pool.execute('SELECT role FROM users WHERE id = ?', [id]);
        if (!user.length) return res.status(404).json({ message: "User not found" });

        await pool.execute('DELETE FROM users WHERE id = ?', [id]);

        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ message: "Server error deleting account" });
    }
});

// Update user info (Universal for Students/Teachers)
router.put('/update-user/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, section } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: "Name and email are required" });
        }

        await pool.execute(
            'UPDATE users SET name = ?, email = ?, section = ? WHERE id = ?',
            [name, email, section || null, id]
        );

        res.json({ message: "User updated successfully" });
    } catch (error) {
        console.error("Update user error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Email already in use" });
        }
        res.status(500).json({ message: "Server error updating user record" });
    }
});

// Create user manually
router.post('/create-user', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { name, email, role, section } = req.body;

        if (!name || !email || !role) {
            return res.status(400).json({ message: "Name, email, and role are required" });
        }

        // Check if email already exists
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const defaultPassword = 'Welcome123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        await pool.execute(
            'INSERT INTO users (name, email, password_hash, role, section, is_verified, is_approved) VALUES (?, ?, ?, ?, ?, 1, 1)',
            [name, email, hashedPassword, role, section || null]
        );

        res.status(201).json({ message: "User created successfully", defaultPassword });
    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({ message: "Server error creating user" });
    }
});

module.exports = router;
