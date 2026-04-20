import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

const MaterialManager = ({ topic, onBack }) => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [title, setTitle] = useState('');
    const [type, setType] = useState('pdf');
    const [contentUrl, setContentUrl] = useState('');

    const fetchMaterials = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/topics/${topic.id}/materials`);
            setMaterials(res.data);
        } catch {
            setError('Failed to load materials');
        } finally {
            setLoading(false);
        }
    }, [topic.id]);

    useEffect(() => {
        if (topic) fetchMaterials();
    }, [topic, fetchMaterials]);

    const handleAddMaterial = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/topics/${topic.id}/materials`, {
                title, type, content_url: contentUrl
            });
            setTitle(''); setType('pdf'); setContentUrl('');
            setShowForm(false);
            fetchMaterials();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add material');
        }
    };

    return (
        <div className="glass-panel animate-fade-in">
            <button onClick={onBack} className="btn btn-outline" style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}>
                &larr; Back to Topics
            </button>

            <h3>Study Materials: {topic.name}</h3>
            {error && <div className="alert alert-error">{error}</div>}

            {showForm ? (
                <form onSubmit={handleAddMaterial} style={{ marginBottom: '2rem', marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
                    <div className="input-group">
                        <label className="input-label">Material Title</label>
                        <input type="text" className="glass-input" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Material Type</label>
                        <select className="glass-input select-input" value={type} onChange={e => setType(e.target.value)}>
                            <option value="pdf">PDF Link</option>
                            <option value="link">External Link</option>
                            <option value="notes">Text Notes</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">{type === 'notes' ? 'Notes Content' : 'URL Link'}</label>
                        {type === 'notes' ? (
                            <textarea className="glass-input" value={contentUrl} onChange={e => setContentUrl(e.target.value)} required rows="4" />
                        ) : (
                            <input type="url" className="glass-input" value={contentUrl} onChange={e => setContentUrl(e.target.value)} required placeholder="https://..." />
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn btn-primary">Upload Material</button>
                        <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">Cancel</button>
                    </div>
                </form>
            ) : (
                <div style={{ marginBottom: '2rem', marginTop: '1rem' }}>
                    <button onClick={() => setShowForm(true)} className="btn btn-primary">
                        + Add Material
                    </button>
                </div>
            )}

            <h4>Existing Materials ({materials.length})</h4>
            {loading ? <div className="spinner"></div> : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {materials.map((m) => (
                        <div key={m.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong>{m.title}</strong>
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.2rem 0.4rem', background: 'var(--secondary)', borderRadius: '4px', color: 'white' }}>
                                    {m.type.toUpperCase()}
                                </span>
                            </div>
                            {m.type !== 'notes' && (
                                <a href={m.content_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                                    View
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MaterialManager;
