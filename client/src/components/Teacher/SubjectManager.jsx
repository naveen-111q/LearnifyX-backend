import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import ConfirmModal from '../Common/ConfirmModal';

const SubjectManager = ({ onSelectSubject }) => {
    const [subjects, setSubjects] = useState([]);

    // Form states
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSubjects = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/subjects');
            setSubjects(res.data);
            setError(null);
        } catch {
            setError('Failed to load subjects');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    const handleCreateOrUpdateSubject = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/subjects/${editingId}`, { name, description });
            } else {
                await api.post('/subjects', { name, description });
            }

            setName('');
            setDescription('');
            setEditingId(null);
            setShowForm(false);
            fetchSubjects();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${editingId ? 'update' : 'create'} subject`);
        }
    };

    const handleEditClick = (subject) => {
        setEditingId(subject.id);
        setName(subject.name);
        setDescription(subject.description);
        setShowForm(true);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setName('');
        setDescription('');
        setShowForm(false);
    };

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const executeDeleteSubject = async () => {
        try {
            await api.delete(`/subjects/${editingId}`);
            resetForm();
            fetchSubjects();
            setDeleteConfirmOpen(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete subject');
            setDeleteConfirmOpen(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setDescription('');
        setShowForm(false);
    };

    return (
        <div className="glass-panel">
            <h3>Manage Subjects</h3>
            {error && <div className="alert alert-error">{error}</div>}

            {showForm ? (
                <form onSubmit={handleCreateOrUpdateSubject} style={{ marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '1rem' }}>{editingId ? 'Edit Subject' : 'Create New Subject'}</h4>
                    <div className="input-group">
                        <label className="input-label">Subject Name</label>
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
                            <button type="submit" className="btn btn-primary">{editingId ? 'Update Subject' : 'Create Subject'}</button>
                            <button type="button" onClick={handleCancelEdit} className="btn btn-outline">Cancel</button>
                        </div>
                        {editingId && (
                            <button type="button" onClick={() => setDeleteConfirmOpen(true)} className="btn btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
                                Delete Subject
                            </button>
                        )}
                    </div>
                </form>
            ) : (
                <div style={{ marginBottom: '2rem' }}>
                    <button onClick={() => setShowForm(true)} className="btn btn-primary">
                        + Create New Subject
                    </button>
                </div>
            )}

            <h4>Your Subjects</h4>
            {loading ? <div className="spinner"></div> : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {subjects.length === 0 ? <p>No subjects created yet.</p> : null}
                    {subjects.map(subject => (
                        <div key={subject.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong>{subject.name}</strong>
                                <p style={{ fontSize: '0.875rem' }}>{subject.description}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleEditClick(subject)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                    Edit
                                </button>
                                <button onClick={() => onSelectSubject(subject)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                    Manage Topics
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <ConfirmModal 
                isOpen={deleteConfirmOpen} 
                message="Are you sure you want to delete this subject? All related topics and questions will be removed."
                onConfirm={executeDeleteSubject}
                onCancel={() => setDeleteConfirmOpen(false)}
            />
        </div>
    );
};

export default SubjectManager;
