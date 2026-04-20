import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../../utils/api';

const TarsChat = () => {
    const [chatHistory, setChatHistory] = useState([]);
    const [chatMessage, setChatMessage] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    const chatEndRef = useRef(null);

    // Initial load
    useEffect(() => {
        const loadInitial = async () => {
            try {
                const chatRes = await api.get('/chat');
                setChatHistory(chatRes.data);
            } catch(e) {
                console.error(e);
            }
        };
        loadInitial();
    }, []);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatMessage.trim()) return;

        const newMsg = { role: 'user', message: chatMessage, timestamp: new Date().toISOString() };
        setChatHistory(prev => [...prev, newMsg]);
        setChatMessage('');
        setChatLoading(true);

        try {
            const res = await api.post('/chat', {
                topic_id: null,
                message: newMsg.message
            });
            setChatHistory(prev => [...prev, { role: 'assistant', message: res.data.reply, timestamp: new Date().toISOString() }]);
        } catch {
            setChatHistory(prev => [...prev, { role: 'assistant', message: 'Sorry, I am having trouble connecting right now.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="glass-panel animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'var(--success)', borderRadius: '50%' }}></span>
                        TARS AI Tutor
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        General Assistance
                    </p>
                </div>
                
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {chatHistory.length === 0 ? (
                        <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-secondary)' }}>
                            <p>Hi! I am TARS, your AI Tutor.</p>
                            <p style={{ fontSize: '0.85rem' }}>Ask me to explain concepts, summarize topics, or generate practice questions.</p>
                        </div>
                    ) : null}
                    
                    {chatHistory.map((chat, idx) => (
                        <div key={idx} style={{ 
                            alignSelf: chat.role === 'user' ? 'flex-end' : 'flex-start',
                            background: chat.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                            padding: '1rem',
                            borderRadius: '12px',
                            borderBottomRightRadius: chat.role === 'user' ? '0' : '12px',
                            borderBottomLeftRadius: chat.role === 'user' ? '12px' : '0',
                            maxWidth: '85%',
                            lineHeight: '1.5'
                        }}>
                            <ReactMarkdown>{chat.message}</ReactMarkdown>
                        </div>
                    ))}
                    {chatLoading && (
                        <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', borderBottomLeftRadius: 0 }}>
                            <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.5rem' }}>
                    <input 
                        type="text" 
                        className="glass-input" 
                        style={{ flex: 1, borderRadius: '20px' }} 
                        placeholder="Ask TARS a question..." 
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        disabled={chatLoading}
                    />
                    <button type="submit" className="btn btn-primary" style={{ borderRadius: '20px', padding: '0 1.5rem' }} disabled={chatLoading || !chatMessage.trim()}>
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TarsChat;
