const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');
const { sendRegistrationOTP, sendPasswordResetOTP } = require('../utils/emailService');

const router = express.Router();

// Helper to generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register User
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, section } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (role !== 'student' && role !== 'teacher') {
            return res.status(400).json({ message: "Invalid role" });
        }

        if (role === 'student' && !section) {
            return res.status(400).json({ message: "Section is required for students" });
        }

        if (section && !/^[A-Za-z]+$/.test(section)) {
            return res.status(400).json({ message: "Section must contain only alphabetical characters" });
        }

        let sectionUpper = section ? section.toUpperCase() : null;

        // Check if user exists
        const [existingUsers] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            if (existingUser.is_verified) {
                return res.status(409).json({ message: "User already exists with this email" });
            } else {
                // User exists but not verified, resend OTP
                const otp = generateOTP();
                const otpExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
                
                await pool.execute(
                    'UPDATE users SET name = ?, password_hash = ?, role = ?, section = ?, otp_code = ?, otp_expiry = ? WHERE id = ?',
                    [name, await bcrypt.hash(password, await bcrypt.genSalt(10)), role, sectionUpper, otp, otpExpiry, existingUser.id]
                );
                
                await sendRegistrationOTP(email, otp);
                return res.status(200).json({ 
                    message: "Verification OTP resent to your email.",
                    requiresVerification: true 
                });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

        // Insert user (unverified by default)
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password_hash, role, section, otp_code, otp_expiry, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, false)',
            [name, email, hashedPassword, role, sectionUpper, otp, otpExpiry]
        );

        // Send Email
        await sendRegistrationOTP(email, otp);

        res.status(201).json({
            message: "Registration started. Please verify your OTP sent to email.",
            requiresVerification: true
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error during registration", error: error.message });
    }
});

// Verify Registration OTP
router.post('/verify-registration', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.is_verified) return res.status(400).json({ message: "User already verified" });
        
        if (user.otp_code !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        
        if (new Date() > new Date(user.otp_expiry)) {
            return res.status(400).json({ message: "OTP has expired. Please register again." });
        }

        // Verify user
        await pool.execute('UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expiry = NULL WHERE id = ?', [user.id]);

        // Students are automatically approved, teachers are not.
        const isApprovedValue = user.role === 'student' ? true : false;
        if (user.role === 'student') {
             await pool.execute('UPDATE users SET is_approved = TRUE WHERE id = ?', [user.id]);
        }

        // Create JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, section: user.section },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: user.role === 'teacher' 
                ? "Email verified successfully. Your account is now pending admin approval."
                : "User verified successfully",
            token,
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role, 
                section: user.section,
                is_approved: isApprovedValue
            }
        });
    } catch (error) {
        console.error("OTP verification error:", error);
        res.status(500).json({ message: "Server error during verification" });
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.is_verified) return res.status(400).json({ message: "User is already verified" });

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
        await pool.execute('UPDATE users SET otp_code = ?, otp_expiry = ? WHERE id = ?', [otp, otpExpiry, user.id]);
        
        await sendRegistrationOTP(email, otp);
        res.json({ message: "OTP resent to your email" });
    } catch (error) {
        console.error("Resend OTP error:", error);
        res.status(500).json({ message: "Server error while resending OTP" });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find user by email or login_id
        let user;
        let [userRecords] = await pool.execute('SELECT * FROM users WHERE email = ? OR login_id = ?', [email, email]);
        
        if (userRecords.length > 0) {
            user = userRecords[0];
        } else {
            // Check if it's an admin (dedicated table)
            const [adminRecords] = await pool.execute('SELECT * FROM admin WHERE email = ? OR admin_id = ?', [email, email]);
            if (adminRecords.length > 0) {
                user = adminRecords[0];
                user.role = 'admin'; // Ensure role is set for admin table records
                user.is_verified = true; // Admins are always verified
                user.is_approved = true; // Admins are always approved
                user.name = 'Administrator';
            }
        }

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Safety check for password_hash
        if (!user.password_hash) {
            console.error(`User ${email} found but has no password_hash!`);
            return res.status(401).json({ message: "Account configuration error. Please contact the administrator." });
        }

        // Check password first (to prevent role enumeration)
        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, user.password_hash);
        } catch (bcryptErr) {
            console.error("Bcrypt comparison error:", bcryptErr);
            throw new Error("Encryption verification failed");
        }

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (!user.is_verified) {
            return res.status(403).json({ message: "Email not verified. Please verify your email.", requiresVerification: true });
        }

        // Check for admin approval (teachers only)
        if (user.role === 'teacher' && !user.is_approved) {
            return res.status(403).json({ 
                message: "Your account is pending admin verification (in progress). Please contact the administrator.",
                pendingApproval: true 
            });
        }

        // Validate role matches the selection (except for admin)
        const userRole = (user.role || '').toLowerCase();
        const selectedRole = (role || '').toLowerCase();
        
        if (selectedRole && userRole !== 'admin' && userRole !== selectedRole) {
            return res.status(403).json({ 
                message: `Access denied. Your account is registered as a ${userRole.toUpperCase()}, but you tried to login as a ${selectedRole.toUpperCase()}.` 
            });
        }

        // Create JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, section: user.section },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: "Login successful",
            token,
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role, 
                section: user.section,
                is_approved: user.is_approved 
            }
        });
    } catch (error) {
        require('fs').appendFileSync('server_error.log', `${new Date().toISOString()} - Login Error: ${error.message}\n${error.stack}\n\n`);
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error during login", error: error.message });
    }
});

// Forgot Password Request
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) {
            // Send same message for security reasons (don't reveal if user exists)
            return res.json({ message: "If your email is registered, you will receive a reset OTP shortly." });
        }

        const resetOtp = generateOTP();
        const resetExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

        await pool.execute('UPDATE users SET reset_otp_code = ?, reset_otp_expiry = ? WHERE id = ?', [resetOtp, resetExpiry, user.id]);
        await sendPasswordResetOTP(email, resetOtp);

        res.json({ message: "If your email is registered, you will receive a reset OTP shortly." });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Server error processing request" });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP, and new password are required" });
        }

        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user || user.reset_otp_code !== otp) {
            return res.status(400).json({ message: "Invalid email or OTP" });
        }

        if (new Date() > new Date(user.reset_otp_expiry)) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.execute(
            'UPDATE users SET password_hash = ?, reset_otp_code = NULL, reset_otp_expiry = NULL WHERE id = ?', 
            [hashedPassword, user.id]
        );

        res.json({ message: "Password has been successfully reset" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Server error resetting password" });
    }
});

// Get current user details
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute('SELECT id, name, email, role, section, department, created_at FROM users WHERE id = ?', [req.user.id]);
        const user = users[0];
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Update user profile (name and section)
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, section } = req.body;
        
        // Validate section if provided (alphabets only)
        if (section && !/^[A-Za-z]+$/.test(section)) {
            return res.status(400).json({ message: "Section must contain only alphabetical characters" });
        }

        const [user] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (!user.length) return res.status(404).json({ message: "User not found" });

        const updatedName = name !== undefined ? name : user[0].name;
        const updatedSection = section !== undefined ? section : user[0].section;

        await pool.execute(
            'UPDATE users SET name = ?, section = ? WHERE id = ?',
            [updatedName, updatedSection || null, req.user.id]
        );

        res.json({ 
            message: "Profile updated successfully", 
            user: { ...user[0], name: updatedName, section: updatedSection } 
        });
    } catch (error) {
        require('fs').appendFileSync('server_error.log', `${new Date().toISOString()} - Profile Update Error: ${error.message}\n${error.stack}\n\n`);
        console.error("Profile update error:", error);
        res.status(500).json({ 
            message: "Server error updating profile", 
            details: error.message 
        });
    }
});

// Fetch all registered students (Teacher only)
router.get('/students', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: "Access denied" });
        }

        const [students] = await pool.execute(
            'SELECT id, name, email, section FROM users WHERE role = ? AND is_verified = TRUE ORDER BY name ASC',
            ['student']
        );
        
        res.json(students);
    } catch (error) {
        console.error("Fetch students error:", error);
        res.status(500).json({ message: "Server error fetching students" });
    }
});

// Fetch active sections (Teacher only)
router.get('/sections', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: "Access denied" });
        }

        const [sections] = await pool.execute(
            "SELECT DISTINCT section FROM users WHERE role = 'student' AND is_verified = TRUE AND section IS NOT NULL AND section != '' ORDER BY section ASC"
        );
        
        res.json(sections.map(s => s.section));
    } catch (error) {
        console.error("Fetch sections error:", error);
        res.status(500).json({ message: "Server error fetching sections" });
    }
});

module.exports = router;
