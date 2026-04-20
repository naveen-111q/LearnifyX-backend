import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import ConfirmModal from '../Common/ConfirmModal';

const QuestionManager = ({ topic, onBack }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [content, setContent] = useState('');
    const [type, setType] = useState('mcq');
    const [optionA, setOptionA] = useState('');
    const [optionB, setOptionB] = useState('');
    const [optionC, setOptionC] = useState('');
    const [optionD, setOptionD] = useState('');
    const [correctOption, setCorrectOption] = useState('A');
    const [difficulty, setDifficulty] = useState('medium');
    const [explanation, setExplanation] = useState('');

    const fetchQuestions = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/topics/${topic.id}/questions`);
            setQuestions(res.data);
        } catch {
            setError('Failed to load questions');
        } finally {
            setLoading(false);
        }
    }, [topic.id]);

    useEffect(() => {
        if (topic) fetchQuestions();
    }, [topic, fetchQuestions]);

    const resetForm = () => {
        setEditingId(null);
        setContent(''); setType('mcq');
        setOptionA(''); setOptionB(''); setOptionC(''); setOptionD('');
        setCorrectOption('A'); setDifficulty('medium'); setExplanation('');
        setShowForm(false);
    };

    const handleCreateOrUpdateQuestion = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                content, type, difficulty, explanation,
                option_a: type === 'mcq' ? optionA : null,
                option_b: type === 'mcq' ? optionB : null,
                option_c: type === 'mcq' ? optionC : null,
                option_d: type === 'mcq' ? optionD : null,
                correct_option: correctOption
            };

            if (editingId) {
                await api.put(`/topics/${topic.id}/questions/${editingId}`, payload);
            } else {
                await api.post(`/topics/${topic.id}/questions`, payload);
            }

            resetForm();
            fetchQuestions();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${editingId ? 'update' : 'add'} question`);
        }
    };

    const handleEditClick = (q) => {
        setEditingId(q.id);
        setContent(q.content);
        setType(q.type || 'mcq');
        setOptionA(q.option_a || '');
        setOptionB(q.option_b || '');
        setOptionC(q.option_c || '');
        setOptionD(q.option_d || '');
        setCorrectOption(q.correct_option || 'A');
        setDifficulty(q.difficulty || 'medium');
        setExplanation(q.explanation || '');
        setShowForm(true);
    };

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const executeDeleteQuestion = async () => {
        try {
            await api.delete(`/topics/${topic.id}/questions/${editingId}`);
            resetForm();
            fetchQuestions();
            setDeleteConfirmOpen(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete question');
            setDeleteConfirmOpen(false);
        }
    };

    // Make sure correctOption resets appropriately if type changes
    useEffect(() => {
        if (!editingId) {
            if (type === 'mcq') setCorrectOption('A');
            else if (type === 'true_false') setCorrectOption('True');
            else if (type === 'short_answer') setCorrectOption('');
        }
    }, [type, editingId]);

    return (
        <div className="glass-panel animate-fade-in">
            <button onClick={onBack} className="btn btn-outline" style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}>
                &larr; Back to Topics
            </button>

            <h3>Question Bank: {topic.name}</h3>
            {error && <div className="alert alert-error">{error}</div>}

            {showForm ? (
                <form onSubmit={handleCreateOrUpdateQuestion} style={{ marginBottom: '2rem', marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '1rem' }}>{editingId ? 'Edit Question' : 'Add New Question'}</h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Question Type</label>
                            <select className="glass-input select-input" value={type} onChange={e => setType(e.target.value)}>
                                <option value="mcq">Multiple Choice</option>
                                <option value="true_false">True / False</option>
                                <option value="short_answer">Short Answer</option>
                            </select>
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Difficulty</label>
                            <select className="glass-input select-input" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Question Content</label>
                        <textarea className="glass-input" value={content} onChange={e => setContent(e.target.value)} required rows="2" />
                    </div>

                    {type === 'mcq' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Option A</label>
                                <input type="text" className="glass-input" value={optionA} onChange={e => setOptionA(e.target.value)} required />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Option B</label>
                                <input type="text" className="glass-input" value={optionB} onChange={e => setOptionB(e.target.value)} required />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Option C</label>
                                <input type="text" className="glass-input" value={optionC} onChange={e => setOptionC(e.target.value)} required />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Option D</label>
                                <input type="text" className="glass-input" value={optionD} onChange={e => setOptionD(e.target.value)} required />
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label className="input-label">Correct Answer</label>
                        {type === 'mcq' && (
                            <select className="glass-input select-input" value={correctOption} onChange={e => setCorrectOption(e.target.value)}>
                                <option value="A">Option A</option>
                                <option value="B">Option B</option>
                                <option value="C">Option C</option>
                                <option value="D">Option D</option>
                            </select>
                        )}
                        {type === 'true_false' && (
                            <select className="glass-input select-input" value={correctOption} onChange={e => setCorrectOption(e.target.value)}>
                                <option value="True">True</option>
                                <option value="False">False</option>
                            </select>
                        )}
                        {type === 'short_answer' && (
                            <input 
                                type="text" 
                                className="glass-input" 
                                value={correctOption} 
                                onChange={e => setCorrectOption(e.target.value)} 
                                placeholder="Enter correct answer"
                                required 
                            />
                        )}
                    </div>

                    <div className="input-group">
                        <label className="input-label">Explanation (shown in practice mode)</label>
                        <textarea className="glass-input" value={explanation} onChange={e => setExplanation(e.target.value)} rows="2" />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary">{editingId ? 'Update Question' : 'Add Question'}</button>
                            <button type="button" onClick={resetForm} className="btn btn-outline">Cancel</button>
                        </div>
                        {editingId && (
                            <button type="button" onClick={() => setDeleteConfirmOpen(true)} className="btn btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
                                Delete Question
                            </button>
                        )}
                    </div>
                </form>
            ) : (
                <div style={{ marginBottom: '2rem', marginTop: '1rem' }}>
                    <button onClick={() => setShowForm(true)} className="btn btn-primary">
                        + Add New Question
                    </button>
                </div>
            )}

            <h4>Existing Questions ({questions.length})</h4>
            {loading ? <div className="spinner"></div> : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {questions.map((q, i) => (
                        <div key={q.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1, paddingRight: '1rem' }}>
                                    <strong>Q{i + 1}. {q.content}</strong>

                                    {(!q.type || q.type === 'mcq') && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.875rem' }}>
                                            <div style={{ color: q.correct_option === 'A' ? 'var(--success)' : 'inherit' }}>A. {q.option_a}</div>
                                            <div style={{ color: q.correct_option === 'B' ? 'var(--success)' : 'inherit' }}>B. {q.option_b}</div>
                                            <div style={{ color: q.correct_option === 'C' ? 'var(--success)' : 'inherit' }}>C. {q.option_c}</div>
                                            <div style={{ color: q.correct_option === 'D' ? 'var(--success)' : 'inherit' }}>D. {q.option_d}</div>
                                        </div>
                                    )}

                                    <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        <strong>Type:</strong> {q.type === 'true_false' ? 'True/False' : q.type === 'short_answer' ? 'Short Answer' : 'Multiple Choice'} |
                                        <strong> Correct:</strong> <span style={{ color: 'var(--success)' }}>{q.correct_option}</span>
                                    </div>
                                    {q.explanation && (
                                        <div style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            <em>Explanation: {q.explanation}</em>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', marginLeft: '1rem' }}>
                                    <span className={`badge badge-${q.difficulty?.toLowerCase() || 'medium'}`}>
                                        {q.difficulty}
                                    </span>
                                    <button onClick={() => handleEditClick(q)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                        Edit
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <ConfirmModal 
                isOpen={deleteConfirmOpen} 
                message="Are you sure you want to delete this question?"
                onConfirm={executeDeleteQuestion}
                onCancel={() => setDeleteConfirmOpen(false)}
            />
        </div>
    );
};

export default QuestionManager;
