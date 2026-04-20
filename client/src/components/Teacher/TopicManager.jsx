import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import ConfirmModal from '../Common/ConfirmModal';

const TopicManager = ({ subject, onBack, onSelectTopic }) => {
    const [topics, setTopics] = useState([]);

    // Form states
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTopics = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/subjects/${subject.id}/topics`);
            setTopics(res.data);
            setError(null);
        } catch {
            setError('Failed to load topics');
        } finally {
            setLoading(false);
        }
    }, [subject.id]);

    useEffect(() => {
        if (subject) fetchTopics();
    }, [subject, fetchTopics]);

    const handleCreateOrUpdateTopic = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/subjects/${subject.id}/topics/${editingId}`, { name, description });
            } else {
                await api.post(`/subjects/${subject.id}/topics`, { name, description });
            }
            setName('');
            setDescription('');
            setEditingId(null);
            setShowForm(false);
            fetchTopics();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${editingId ? 'update' : 'create'} topic`);
        }
    };

    const handleEditClick = (topic) => {
        setEditingId(topic.id);
        setName(topic.name);
        setDescription(topic.description);
        setShowForm(true);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setName('');
        setDescription('');
        setShowForm(false);
    };

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const executeDeleteTopic = async () => {
        try {
            await api.delete(`/subjects/${subject.id}/topics/${editingId}`);
            handleCancelEdit();
            fetchTopics();
            setDeleteConfirmOpen(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete topic');
            setDeleteConfirmOpen(false);
        }
    };

    return (
        <div className="glass-panel animate-fade-in">
            <button onClick={onBack} className="btn btn-outline" style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}>
                &larr; Back to Subjects
            </button>

            <h3>Topics for: {subject.name}</h3>
            {error && <div className="alert alert-error">{error}</div>}

            {showForm ? (
                <form onSubmit={handleCreateOrUpdateTopic} style={{ marginBottom: '2rem', marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '1rem' }}>{editingId ? 'Edit Topic' : 'Create New Topic'}</h4>
                    <div className="input-group">
                        <label className="input-label">Topic Name</label>
                        <input
                            type="text"
                            className="glass-input"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Description (Optional)</label>
                        <textarea
                            className="glass-input"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows="2"
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary">{editingId ? 'Update Topic' : 'Add Topic'}</button>
                            <button type="button" onClick={handleCancelEdit} className="btn btn-outline">Cancel</button>
                        </div>
                        {editingId && (
                            <button type="button" onClick={() => setDeleteConfirmOpen(true)} className="btn btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
                                Delete Topic
                            </button>
                        )}
                    </div>
                </form>
            ) : (
                <div style={{ marginBottom: '2rem', marginTop: '1rem' }}>
                    <button onClick={() => setShowForm(true)} className="btn btn-primary">
                        + Create New Topic
                    </button>
                </div>
            )}

            <h4>Existing Topics</h4>
            {loading ? <div className="spinner"></div> : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {topics.length === 0 ? <p>No topics created yet.</p> : null}
                    {topics.map(topic => (
                        <div key={topic.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong>{topic.name}</strong>
                                <p style={{ fontSize: '0.875rem' }}>{topic.description}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleEditClick(topic)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                    Edit
                                </button>
                                <button onClick={() => onSelectTopic(topic, 'materials')} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                    Materials
                                </button>
                                <button onClick={() => onSelectTopic(topic, 'questions')} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                    Questions
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <ConfirmModal 
                isOpen={deleteConfirmOpen} 
                message="Are you sure you want to delete this topic? All related questions and materials will be removed."
                onConfirm={executeDeleteTopic}
                onCancel={() => setDeleteConfirmOpen(false)}
            />
        </div>
    );
};

export default TopicManager;
