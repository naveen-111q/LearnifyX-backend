import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { MessageSquare, X } from 'lucide-react';
import TarsChat from './TarsChat';
import { useNotification } from '../../context/NotificationContext';


const Materials = ({ onBack }) => {
    const { showInfo } = useNotification();
    const [subjects, setSubjects] = useState([]);

    const [topics, setTopics] = useState([]);
    const [materials, setMaterials] = useState([]);

    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [showChat, setShowChat] = useState(false);

    // Initial load
    useEffect(() => {
        const loadInitial = async () => {
            try {
                const res = await api.get('/subjects');
                setSubjects(res.data);
            } catch {
                console.error("Failed to load subjects");
            }
        };
        loadInitial();
    }, []);

    // Load topics when subject changes
    useEffect(() => {
        if (!selectedSubjectId) return;
        api.get(`/subjects/${selectedSubjectId}/topics`).then(res => setTopics(res.data)).catch(() => {});
    }, [selectedSubjectId]);

    // Load materials when topic changes
    useEffect(() => {
        if (!selectedTopic) return;
        api.get(`/topics/${selectedTopic.id}/materials`).then(res => setMaterials(res.data)).catch(() => {});
    }, [selectedTopic]);

    return (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto', position: 'relative', minHeight: '80vh' }}>
            <button onClick={onBack} className="btn btn-outline" style={{ marginBottom: '1.5rem', alignSelf: 'flex-start', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                &larr; Back to Dashboard
            </button>
            <h3 style={{ marginBottom: '1rem' }}>Study Materials</h3>
            <p>Select a subject and topic to view available reading materials, notes, and links.</p>

            <div className="input-group" style={{ marginBottom: '1rem', marginTop: '1.5rem' }}>
                <label className="input-label">Subject</label>
                <select className="glass-input select-input" value={selectedSubjectId} onChange={e => {
                    setSelectedSubjectId(e.target.value);
                    if (!e.target.value) {
                        setTopics([]);
                        setSelectedTopic(null);
                    }
                }}>
                    <option value="">Select a Subject...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            {topics.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {topics.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSelectedTopic(t)}
                            className={`btn ${selectedTopic?.id === t.id ? 'btn-primary' : 'btn-outline'}`}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>
            )}

            {selectedTopic && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                    <h4>Materials for: {selectedTopic.name}</h4>
                    {materials.length === 0 ? <p style={{ fontSize: '0.875rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>No materials uploaded for this topic yet.</p> : null}
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        {materials.map(m => (
                            <li key={m.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-subtle)' }}>
                                <div>
                                    <h5 style={{ margin: 0, fontSize: '1.05rem' }}>{m.title}</h5>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.5rem' }}>{m.type}</span>
                                </div>
                                {m.type === 'notes' ? (
                                    <button className="btn btn-outline" onClick={() => showInfo(m.content_url)}>Read Notes</button>
                                ) : (
                                    <a href={m.content_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.5rem 1rem', textDecoration: 'none' }}>Open {m.type.toUpperCase()}</a>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Floating Helpi Chatbot Button */}
            {!showChat && (
                <button
                    onClick={() => setShowChat(true)}
                    className="btn btn-primary"
                    style={{ position: 'fixed', bottom: '2rem', right: '2rem', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 100, padding: 0 }}
                    title="Ask TARS AI"
                >
                    <MessageSquare size={26} />
                </button>
            )}

            {/* Helpi Chatbot Popup Layer */}
            {showChat && (
                <div className="animate-fade-in" style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    width: '350px', height: '500px', maxHeight: '75vh',
                    zIndex: 9999, borderRadius: '16px', overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                    background: 'var(--bg-gradient-start)',
                    border: '1px solid var(--primary)',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{
                        background: 'var(--primary)', padding: '0.8rem',
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                    >
                        <span style={{ color: 'white', paddingLeft: '0.5rem', fontSize: '0.9rem', userSelect: 'none', fontWeight: '500' }}>
                            TARS AI Tutor
                        </span>
                        <button onClick={() => setShowChat(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <TarsChat />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Materials;
