const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/chat
 * @desc    Simulate AI Chatbot response contextually
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { topic_id, message } = req.body;
        
        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // 1. Save user's message to chat history
        await pool.execute(
            'INSERT INTO chat_history (user_id, topic_id, role, message) VALUES (?, ?, ?, ?)',
            [req.user.id, topic_id || null, 'user', message]
        );

        // 2. Real AI Response Generation with OpenRouter
        let aiResponse = '';
        
        if (!process.env.OPENROUTER_API_KEY) {
            aiResponse = `[System Message] I am unable to answer real questions yet because the OPENROUTER_API_KEY is missing from your server's .env file! Please add it and restart the server, then I will be fully functional.`;
        } else {
            console.log('Generating real AI response from OpenRouter...');
            
            // Build simple context
            const promptContext = `You are a helpful study tutor for students. Be concise, accurate, and encouraging. The student is asking: ${message}`;
            
            try {
                // By default node 18+ has built-in fetch
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:5000",
                        "X-Title": "Exam Practice DB"
                    },
                    body: JSON.stringify({
                        "model": "google/gemini-2.5-flash",
                        "max_tokens": 800,
                        "messages": [
                            {"role": "user", "content": promptContext}
                        ]
                    })
                });
                
                const data = await response.json();
                if (data.choices && data.choices.length > 0) {
                    aiResponse = data.choices[0].message.content;
                } else {
                    console.error("OpenRouter API Error Data:", data);
                    aiResponse = "I'm having trouble thinking of a response.";
                }
            } catch (apiError) {
                console.error("OpenRouter API Error:", apiError);
                aiResponse = `I encountered an issue connecting to my brain! (API Error)`;
            }
        }

        // 3. Save AI's response to chat history
        await pool.execute(
            'INSERT INTO chat_history (user_id, topic_id, role, message) VALUES (?, ?, ?, ?)',
            [req.user.id, topic_id || null, 'assistant', aiResponse]
        );

        // 4. Return the response
        res.json({
            reply: aiResponse
        });

    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ message: 'Server error processing chat' });
    }
});

/**
 * @route   GET /api/chat
 * @desc    Get chat history for the user, globally
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const query = 'SELECT * FROM chat_history WHERE user_id = ? ORDER BY timestamp ASC';
        const [history] = await pool.execute(query, [req.user.id]);
        res.json(history);
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ message: 'Server error fetching chat history' });
    }
});

/**
 * @route   GET /api/chat/:topicId
 * @desc    Get chat history for the user, filtered by topic
 */
router.get('/:topicId', authenticateToken, async (req, res) => {
    try {
        const query = 'SELECT * FROM chat_history WHERE user_id = ? AND topic_id = ? ORDER BY timestamp ASC';
        const [history] = await pool.execute(query, [req.user.id, req.params.topicId]);
        res.json(history);
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ message: 'Server error fetching chat history' });
    }
});

/**
 * @route   DELETE /api/chat
 * @desc    Clear all chat history for the user
 */
router.delete('/', authenticateToken, async (req, res) => {
    try {
        await pool.execute('DELETE FROM chat_history WHERE user_id = ?', [req.user.id]);
        res.json({ message: 'Chat history cleared successfully' });
    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({ message: 'Server error clearing chat history' });
    }
});


module.exports = router;
