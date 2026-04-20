require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const pool = require('./db');

const authRoutes = require('./routes/authRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const questionRoutes = require('./routes/questionRoutes');
const examRoutes = require('./routes/examRoutes');
const materialRoutes = require('./routes/materialRoutes');
const chatRoutes = require('./routes/chatRoutes');
const practiceRoutes = require('./routes/practiceRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Global Logger (FIRST)
app.use((req, res, next) => {
    try {
        require('fs').appendFileSync('access.log', `${new Date().toISOString()} - ${req.method} ${req.url}\n`);
    } catch (e) { }
    next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/topics', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/topics', materialRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/admin', adminRoutes);

// // Serving Frontend Static Files (Production)
// app.use(express.static(path.join(__dirname, '../client/dist')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        connection.release();
        res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
    }
});
app.get("/", (req, res) => {
    res.send("API is running...");
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (0.0.0.0)`);
});

// // Catch-all route to serve index.html for SPA (Production)
// app.use((req, res) => {
//     res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
// });
