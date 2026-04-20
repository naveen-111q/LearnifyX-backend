import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import ConfirmModal from '../Common/ConfirmModal';


const PracticeArena = ({ onBack }) => {
    const [subjects, setSubjects] = useState([]);
    const [subjectId, setSubjectId] = useState('');
    const [topics, setTopics] = useState([]);
    const [topicId, setTopicId] = useState('');

    const [easyCount, setEasyCount] = useState(2);
    const [mediumCount, setMediumCount] = useState(2);
    const [hardCount, setHardCount] = useState(1);

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showError, showInfo } = useNotification();
    const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);


    // UI states
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState({}); // { qId: 'A' }

    const [loadingTopics, setLoadingTopics] = useState(false);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await api.get('/subjects');
                setSubjects(res.data);
                if (res.data.length > 0) setSubjectId(res.data[0].id);
            } catch {
                console.error("Failed to load subjects for practice");
            }
        };
        fetchSubjects();
    }, []);

    useEffect(() => {
        const fetchTopics = async () => {
            if (!subjectId) return;
            setLoadingTopics(true);
            try {
                const res = await api.get(`/subjects/${subjectId}/topics`);
                setTopics(res.data);
                if (res.data.length > 0) {
                    setTopicId(res.data[0].id);
                } else {
                    setTopicId('');
                }
            } catch {
                console.error("Failed to load topics");
            } finally {
                setLoadingTopics(false);
            }
        };
        fetchTopics();
    }, [subjectId]);

    const startPractice = async () => {
        if (!topicId) return showError('Please select a topic first.');
        if (easyCount + mediumCount + hardCount <= 0) return showError('Please request at least one question.');

        setLoading(true);
        setQuestions([]);
        setSelectedAnswers({});
        setIsSubmitted(false);
        try {
            const res = await api.post(`/practice/generate`, {
                topicId,
                easyCount,
                mediumCount,
                hardCount
            });
            if (res.data.questions.length === 0) {
                showInfo('No questions found for the selected criteria. The teacher might not have added questions yet.');
            } else {
                setQuestions(res.data.questions);
            }
        } catch {
            showError('Failed to start practice session');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (qId, option) => {
        if (isSubmitted) return;
        setSelectedAnswers(prev => ({ ...prev, [qId]: option }));
    };

    const calculateScore = () => {
        let score = 0;
        questions.forEach(q => {
            const selOpt = selectedAnswers[q.id] || '';
            if (q.type === 'short_answer') {
                if (selOpt.trim().toLowerCase() === q.correct_option.trim().toLowerCase()) score++;
            } else {
                if (selOpt === q.correct_option) score++;
            }
        });
        return score;
    };

    if (questions.length > 0) {
        const score = calculateScore();
        return (
            <div className="glass-panel animate-fade-in">
                <button onClick={() => setQuestions([])} className="btn btn-outline" style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem' }}>
                    &larr; Exit Practice
                </button>
                <div style={{ paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3>Practice Session</h3>
                        {isSubmitted ? (
                            <p>Test complete! Review your results below.</p>
                        ) : (
                            <p>Answer the questions below, then submit to view your results. This does not affect your grades.</p>
                        )}
                    </div>
                    {isSubmitted && (
                        <div style={{ background: 'var(--primary)', color: 'white', padding: '1rem 2rem', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Final Score</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{score} / {questions.length}</div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gap: '2rem' }}>
                    {questions.map((q, idx) => {
                        const selOpt = selectedAnswers[q.id] || '';

                        let isCorrect = false;
                        if (q.type === 'short_answer') {
                            isCorrect = selOpt.trim().toLowerCase() === q.correct_option.trim().toLowerCase();
                        } else {
                            isCorrect = selOpt === q.correct_option;
                        }

                        return (
                            <div key={q.id} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', borderLeft: isSubmitted ? (isCorrect ? '4px solid var(--success)' : '4px solid var(--error)') : '4px solid transparent' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <strong style={{ fontSize: '1.1rem' }}>Q{idx + 1}. {q.content}</strong>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginRight: '0.5rem' }}>
                                            {q.topic_name}
                                        </span>
                                        <span className={`badge badge-${q.difficulty?.toLowerCase() || 'medium'}`}>
                                            {q.difficulty}
                                        </span>
                                    </div>
                                </div>

                                {(!q.type || q.type === 'mcq') && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {['A', 'B', 'C', 'D'].map(opt => {
                                            let bg = 'rgba(255,255,255,0.05)';
                                            const optKey = `option_${opt.toLowerCase()}`;

                                            if (isSubmitted) {
                                                if (opt === q.correct_option) bg = 'rgba(16, 185, 129, 0.2)'; // Correct is always green
                                                else if (opt === selOpt) bg = 'rgba(239, 68, 68, 0.2)'; // Wrong selected is red
                                            } else if (selOpt === opt) {
                                                bg = 'rgba(79, 70, 229, 0.2)';
                                            }

                                            return (
                                                <div key={opt}
                                                    onClick={() => handleAnswerSelect(q.id, opt)}
                                                    style={{ padding: '1rem', background: bg, border: `1px solid ${selOpt === opt ? 'var(--primary)' : 'var(--border-subtle)'}`, borderRadius: '8px', cursor: isSubmitted ? 'default' : 'pointer' }}>
                                                    <strong>{opt}.</strong> {q[optKey]}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {q.type === 'true_false' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {['True', 'False'].map(opt => {
                                            let bg = 'rgba(255,255,255,0.05)';
                                            if (isSubmitted) {
                                                if (opt === q.correct_option) bg = 'rgba(16, 185, 129, 0.2)';
                                                else if (opt === selOpt) bg = 'rgba(239, 68, 68, 0.2)';
                                            } else if (selOpt === opt) {
                                                bg = 'rgba(79, 70, 229, 0.2)';
                                            }

                                            return (
                                                <div key={opt}
                                                    onClick={() => handleAnswerSelect(q.id, opt)}
                                                    style={{ padding: '1rem', background: bg, border: `1px solid ${selOpt === opt ? 'var(--primary)' : 'var(--border-subtle)'}`, borderRadius: '8px', cursor: isSubmitted ? 'default' : 'pointer', textAlign: 'center' }}>
                                                    <strong>{opt}</strong>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}


                                {isSubmitted && (
                                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                                        <strong style={{ color: isCorrect ? 'var(--success)' : 'var(--error)' }}>
                                            {isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${q.correct_option}.`}
                                        </strong>
                                        {q.explanation && (
                                            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                                <strong>Explanation:</strong> {q.explanation}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {!isSubmitted && (
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                        <button
                            onClick={() => setSubmitConfirmOpen(true)}
                            className="btn btn-primary"
                        >
                            Submit Practice Test
                        </button>
                    </div>
                )}
                
                <ConfirmModal 
                    isOpen={submitConfirmOpen}
                    message="Are you sure you want to submit your practice test?"
                    confirmText="Submit Test"
                    isDanger={false}
                    onConfirm={() => {
                        setIsSubmitted(true);
                        setSubmitConfirmOpen(false);
                        window.scrollTo(0, 0);
                    }}
                    onCancel={() => setSubmitConfirmOpen(false)}
                />
            </div>
        )
    }

    return (
        <div className="glass-panel animate-fade-in">
            <button onClick={onBack} className="btn btn-outline" style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem' }}>
                &larr; Back to Dashboard
            </button>
            <h3>Practice Arena</h3>
            <p>Select a subject and a topic to generate a custom practice test. You can choose the difficulty mix!</p>

            <div style={{ marginTop: '2rem', display: 'grid', gap: '1.5rem' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Subject</label>
                        <select className="glass-input select-input" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                            {subjects.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Topic</label>
                        <select className="glass-input select-input" value={topicId} onChange={e => setTopicId(e.target.value)} disabled={topics.length === 0}>
                            {topics.length === 0 && <option value="">No topics available</option>}
                            {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Difficulty Mix</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Easy Questions</label>
                            <input type="number" min="0" max="20" className="glass-input" value={easyCount} onChange={e => setEasyCount(Number(e.target.value))} />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Medium Questions</label>
                            <input type="number" min="0" max="20" className="glass-input" value={mediumCount} onChange={e => setMediumCount(Number(e.target.value))} />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Hard Questions</label>
                            <input type="number" min="0" max="20" className="glass-input" value={hardCount} onChange={e => setHardCount(Number(e.target.value))} />
                        </div>
                    </div>
                </div>

                <div>
                    <button onClick={startPractice} disabled={loading || !subjectId || !topicId || loadingTopics} className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                        {loading ? 'Generating...' : 'Start Practice'}
                    </button>
                    {!loadingTopics && topics.length === 0 && subjectId && (
                        <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '0.5rem', textAlign: 'center' }}>
                            Your teacher has not uploaded any topics for this subject yet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PracticeArena;
