import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { Trash2 } from 'lucide-react';
import ConfirmModal from '../Common/ConfirmModal';

const ExamManager = () => {
    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [activeSections, setActiveSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editExamId, setEditExamId] = useState(null);
    const [subjectId, setSubjectId] = useState('');
    const [allowedSection, setAllowedSection] = useState('');
    const [title, setTitle] = useState('');
    const [examDate, setExamDate] = useState('');
    const [startTime, setStartTime] = useState({ hour: '12', min: '00', ampm: 'PM' });
    const [endTime, setEndTime] = useState({ hour: '01', min: '00', ampm: 'PM' });

    const defaultQuestion = { type: 'mcq', content: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', text_answer: '', marks: 1 };
    const [questions, setQuestions] = useState([{ ...defaultQuestion }]);
    const [expandedIndex, setExpandedIndex] = useState(0);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [examsRes, subjectsRes, sectionsRes] = await Promise.all([
                api.get('/exams'),
                api.get('/subjects'),
                api.get('/auth/sections')
            ]);
            setExams(examsRes.data);
            setSubjects(subjectsRes.data);
            setActiveSections(sectionsRes.data);
            if (subjectsRes.data.length > 0 && !subjectId) {
                setSubjectId(subjectsRes.data[0].id);
            }
        } catch {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [subjectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddQuestion = () => {
        setQuestions([...questions, { ...defaultQuestion }]);
        setExpandedIndex(questions.length);
    };

    const handleRemoveQuestion = (index) => {
        if (questions.length === 1) return;
        const newQ = questions.filter((_, i) => i !== index);
        setQuestions(newQ);
    };

    const updateQuestion = (index, field, value) => {
        const newQ = [...questions];
        newQ[index][field] = value;
        // When type changes, reset correct_option to the appropriate default
        if (field === 'type') {
            if (value === 'tf') {
                newQ[index].correct_option = 'True';
            } else if (value === 'mcq') {
                newQ[index].correct_option = 'A';
            }
        }
        setQuestions(newQ);
    };

    const handleEdit = async (id) => {
        try {
            setError(null);
            const res = await api.get(`/exams/${id}`);
            const ex = res.data;
            setTitle(ex.title);
            setSubjectId(ex.subject_id);
            setAllowedSection(ex.allowed_section || '');
            if (ex.exam_date) {
                const d = new Date(ex.exam_date);
                setExamDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
            }

            const parseTime = (timeStr) => {
                if (!timeStr) return { hour: '12', min: '00', ampm: 'PM' };
                let [h, m] = timeStr.split(':');
                h = parseInt(h, 10);
                const ampm = h >= 12 ? 'PM' : 'AM';
                h = h % 12;
                if (h === 0) h = 12;
                return { hour: String(h).padStart(2, '0'), min: m, ampm };
            };

            setStartTime(parseTime(ex.start_time));
            setEndTime(parseTime(ex.end_time));
            if (ex.questions && ex.questions.length > 0) {
                // For TF questions, the correct answer is stored in text_answer on the server.
                // Remap it back into correct_option so the form dropdown shows the right value.
                const mapped = ex.questions.map(q => {
                    if ((q.type === 'tf' || q.type === 'true_false') && q.text_answer && !q.correct_option) {
                        return { ...q, correct_option: q.text_answer };
                    }
                    return q;
                });
                setQuestions(mapped);
            } else {
                setQuestions([{ ...defaultQuestion }]);
            }
            setIsEditing(true);
            setEditExamId(id);
            setShowForm(true);
            window.scrollTo(0, 0);
        } catch {
            setError('Failed to load exam details for editing');
        }
    };

    const handleCreateExam = async (e) => {
        e.preventDefault();
        try {
            if (!examDate || !startTime || !endTime) {
                setError("Please provide a valid Date, Start Time, and End Time.");
                return;
            }

            // Verify all questions have required fields based on type
            for (const q of questions) {
                if (!q.content) return setError("All questions must have content.");
                if (q.type === 'mcq' && (!q.option_a || !q.option_b || !q.option_c || !q.option_d)) {
                    setError("All MCQ questions must have 4 options filled out.");
                    return;
                }
                if (q.type === 'fib' && !q.text_answer) {
                    setError("Fill in the blank questions must have a correct text answer.");
                    return;
                }
            }

            const formatTime = (timeObj) => {
                let h = parseInt(timeObj.hour, 10);
                if (timeObj.ampm === 'PM' && h !== 12) h += 12;
                if (timeObj.ampm === 'AM' && h === 12) h = 0;
                return `${String(h).padStart(2, '0')}:${timeObj.min}:00`;
            };

            const payload = {
                subject_id: subjectId,
                title,
                allowed_section: allowedSection,
                exam_date: examDate,
                start_time: formatTime(startTime),
                end_time: formatTime(endTime),
                questions
            };

            if (isEditing) {
                await api.put(`/exams/${editExamId}`, payload);
            } else {
                await api.post('/exams', payload);
            }

            setTitle(''); setExamDate('');
            setStartTime({ hour: '12', min: '00', ampm: 'PM' });
            setEndTime({ hour: '01', min: '00', ampm: 'PM' });
            setAllowedSection('');
            setQuestions([{ ...defaultQuestion }]);
            setExpandedIndex(0);
            setShowForm(false);
            setIsEditing(false);
            setEditExamId(null);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} exam`);
        }
    };

    const handlePublish = async (id) => {
        try {
            await api.post(`/exams/${id}/publish`);
            fetchData();
        } catch {
            setError('Failed to publish exam');
        }
    };

    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const executeDelete = async () => {
        try {
            await api.delete(`/exams/${deleteConfirmId}`);
            setDeleteConfirmId(null);
            fetchData();
        } catch {
            setError('Failed to delete exam');
            setDeleteConfirmId(null);
        }
    };

    return (
        <div className="glass-panel animate-fade-in">
            <h3>Manage Final Exams</h3>
            <p>Create strict final exams by manually adding questions and assigning specific marks.</p>
            {error && <div className="alert alert-error">{error}</div>}

            {showForm ? (
                <form onSubmit={handleCreateExam} style={{ marginBottom: '2rem', marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Exam Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">Exam Title</label>
                            <input type="text" className="glass-input" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Subject</label>
                            <select className="glass-input select-input" value={subjectId} onChange={e => setSubjectId(e.target.value)} required>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Conduct For (Section)</label>
                            <select className="glass-input select-input" value={allowedSection} onChange={e => setAllowedSection(e.target.value)}>
                                <option value="">All Sections (Default)</option>
                                {activeSections.map(s => <option key={s} value={s}>Section {s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">Exam Date</label>
                            <input type="date" className="glass-input" value={examDate} onChange={e => setExamDate(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Start Time (12-Hr)</label>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <select className="glass-input select-input" style={{ flex: 1, padding: '0.4rem' }} value={startTime.hour} onChange={e => setStartTime({ ...startTime, hour: e.target.value })}>
                                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <span>:</span>
                                <select className="glass-input select-input" style={{ flex: 1, padding: '0.4rem' }} value={startTime.min} onChange={e => setStartTime({ ...startTime, min: e.target.value })}>
                                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select className="glass-input select-input" style={{ flex: 1, padding: '0.4rem' }} value={startTime.ampm} onChange={e => setStartTime({ ...startTime, ampm: e.target.value })}>
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">End Time (12-Hr)</label>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <select className="glass-input select-input" style={{ flex: 1, padding: '0.4rem' }} value={endTime.hour} onChange={e => setEndTime({ ...endTime, hour: e.target.value })}>
                                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <span>:</span>
                                <select className="glass-input select-input" style={{ flex: 1, padding: '0.4rem' }} value={endTime.min} onChange={e => setEndTime({ ...endTime, min: e.target.value })}>
                                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select className="glass-input select-input" style={{ flex: 1, padding: '0.4rem' }} value={endTime.ampm} onChange={e => setEndTime({ ...endTime, ampm: e.target.value })}>
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <h4 style={{ marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Questions</h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        {questions.map((q, idx) => {
                            const isExpanded = expandedIndex === idx;
                            return (
                                <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: isExpanded ? '1rem' : '0' }}>
                                        <h5 style={{ margin: 0, cursor: 'pointer' }} onClick={() => setExpandedIndex(isExpanded ? -1 : idx)}>
                                            Question {idx + 1} {q.type && `(${q.type.toUpperCase()})`} {isExpanded ? '▼' : '►'}
                                        </h5>
                                        <div>
                                            {!isExpanded && <span style={{ marginRight: '1rem', color: 'var(--text-secondary)' }}>{q.content ? q.content.substring(0, 30) + '...' : 'Empty Question'}</span>}
                                            {questions.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveQuestion(idx)} style={{ color: 'var(--error)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Remove</button>
                                            )}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                                <div className="input-group">
                                                    <label className="input-label">Question Type</label>
                                                    <select className="glass-input select-input" value={q.type || 'mcq'} onChange={e => updateQuestion(idx, 'type', e.target.value)}>
                                                        <option value="mcq">Multiple Choice</option>
                                                        <option value="tf">True / False</option>
                                                        <option value="fib">Fill in the Blank</option>
                                                    </select>
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Marks for this Question</label>
                                                    <input type="number" min="1" className="glass-input" value={q.marks || 1} onChange={e => updateQuestion(idx, 'marks', e.target.value)} required />
                                                </div>
                                            </div>

                                            <div className="input-group">
                                                <label className="input-label">Question Content</label>
                                                <textarea className="glass-input" rows="2" value={q.content} onChange={e => updateQuestion(idx, 'content', e.target.value)} required />
                                            </div>

                                            {(!q.type || q.type === 'mcq') && (
                                                <>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                                        <div className="input-group">
                                                            <label className="input-label">Option A</label>
                                                            <input type="text" className="glass-input" value={q.option_a || ''} onChange={e => updateQuestion(idx, 'option_a', e.target.value)} required />
                                                        </div>
                                                        <div className="input-group">
                                                            <label className="input-label">Option B</label>
                                                            <input type="text" className="glass-input" value={q.option_b || ''} onChange={e => updateQuestion(idx, 'option_b', e.target.value)} required />
                                                        </div>
                                                        <div className="input-group">
                                                            <label className="input-label">Option C</label>
                                                            <input type="text" className="glass-input" value={q.option_c || ''} onChange={e => updateQuestion(idx, 'option_c', e.target.value)} required />
                                                        </div>
                                                        <div className="input-group">
                                                            <label className="input-label">Option D</label>
                                                            <input type="text" className="glass-input" value={q.option_d || ''} onChange={e => updateQuestion(idx, 'option_d', e.target.value)} required />
                                                        </div>
                                                    </div>
                                                    <div className="input-group" style={{ marginTop: '1rem' }}>
                                                        <label className="input-label">Correct Option</label>
                                                        <select className="glass-input select-input" value={q.correct_option || 'A'} onChange={e => updateQuestion(idx, 'correct_option', e.target.value)}>
                                                            <option value="A">A</option>
                                                            <option value="B">B</option>
                                                            <option value="C">C</option>
                                                            <option value="D">D</option>
                                                        </select>
                                                    </div>
                                                </>
                                            )}

                                            {q.type === 'tf' && (
                                                <div className="input-group" style={{ marginTop: '1rem' }}>
                                                    <label className="input-label">Correct Answer</label>
                                                    <select className="glass-input select-input" value={q.correct_option || 'True'} onChange={e => updateQuestion(idx, 'correct_option', e.target.value)}>
                                                        <option value="True">True</option>
                                                        <option value="False">False</option>
                                                    </select>
                                                </div>
                                            )}

                                            {q.type === 'fib' && (
                                                <div className="input-group" style={{ marginTop: '1rem' }}>
                                                    <label className="input-label">Correct Answer (Text Matching)</label>
                                                    <input 
                                                        type="text" 
                                                        className="glass-input" 
                                                        placeholder="Enter the correct word or phrase..."
                                                        value={q.text_answer || ''} 
                                                        onChange={e => updateQuestion(idx, 'text_answer', e.target.value)} 
                                                        required 
                                                    />
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                                        💡 Grading is case-insensitive. Extra spaces at start/end are ignored.
                                                    </p>
                                                </div>
                                            )}

                                            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                                                <button type="button" onClick={() => setExpandedIndex(-1)} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Done Editing Question</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <button type="button" onClick={handleAddQuestion} className="btn btn-outline" style={{ marginBottom: '2rem', width: '100%' }}>+ Add Another Question</button>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn btn-primary">{isEditing ? 'Save Changes' : 'Create Final Exam (Draft)'}</button>
                        <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">Cancel</button>
                    </div>
                </form>
            ) : (
                <div style={{ marginBottom: '2rem', marginTop: '1rem' }}>
                    <button onClick={() => {
                        setIsEditing(false);
                        setEditExamId(null);
                        setTitle(''); setExamDate('');
                        setStartTime({ hour: '12', min: '00', ampm: 'PM' });
                        setEndTime({ hour: '01', min: '00', ampm: 'PM' });
                        setAllowedSection('');
                        setQuestions([{ ...defaultQuestion }]);
                        setShowForm(true);
                    }} className="btn btn-primary">
                        + Create Final Exam
                    </button>
                </div>
            )}

            <h4>Exam List</h4>
            {loading ? <div className="spinner"></div> : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {exams.length === 0 ? <p>No exams created yet.</p> : null}
                    {exams.map((exam) => {
                        const subjectName = subjects.find(s => s.id === exam.subject_id)?.name || 'Unknown Subject';

                        let dateStr = "Unknown Date";
                        if (exam.exam_date) {
                            dateStr = new Date(exam.exam_date).toLocaleDateString();
                        }

                        return (
                            <div key={exam.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: exam.status === 'published' ? '4px solid var(--success)' : '4px solid var(--text-secondary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong>{exam.title}</strong> ({subjectName})
                                        {exam.allowed_section && <span style={{ marginLeft: '10px', fontSize: '0.8rem', padding: '0.2rem 0.6rem', background: 'rgba(79, 70, 229, 0.2)', color: 'var(--primary)', borderRadius: '12px' }}>Section {exam.allowed_section}</span>}
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                            Date: {dateStr} | Window: {exam.start_time} - {exam.end_time} | Total Marks: {exam.total_marks}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: exam.status === 'published' ? 'var(--success)' : 'inherit' }}>
                                            {exam.status}
                                        </span>
                                        <button onClick={() => handleEdit(exam.id)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
                                            Edit
                                        </button>
                                        {exam.status === 'draft' && (
                                            <button onClick={() => handlePublish(exam.id)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
                                                Publish
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setDeleteConfirmId(exam.id)}
                                            className="btn btn-outline"
                                            style={{ padding: '0.4rem', border: '1px solid var(--error)', color: 'var(--error)' }}
                                            title="Delete Exam"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
            <ConfirmModal 
                isOpen={!!deleteConfirmId} 
                message="Are you absolutely sure you want to delete this exam? This will erase all student results associated with it."
                onConfirm={executeDelete}
                onCancel={() => setDeleteConfirmId(null)}
            />
        </div>
    );
};

export default ExamManager;
