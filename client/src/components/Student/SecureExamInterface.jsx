import React, { useState, useEffect, useRef, useCallback } from 'react';
import useAntiCheating from '../../hooks/useAntiCheating';
import api from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';


const SecureExamInterface = ({ examId, onComplete }) => {
    const { showSuccess, showError } = useNotification();
    const [questions, setQuestions] = useState([]);

    const [attemptId, setAttemptId] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});

    const [timeLeft, setTimeLeft] = useState(null);
    const [examStarted, setExamStarted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showLaunchScreen, setShowLaunchScreen] = useState(false);
    const isSubmittingRef = useRef(false);
    const hasFetchedRef = useRef(false); // Prevent React StrictMode double-fire

    const [warningCount, setWarningCount] = useState(0);
    const MAX_WARNINGS = 2;
    const [violationType, setViolationType] = useState(null);

    const handleFinalSubmit = useCallback(async () => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        try {
            const res = await api.post(`/exams/attempt/${attemptId}/submit`);
            showSuccess(`Exam submitted! Score: ${res.data.score} / ${res.data.totalMarks || '?'}`);
            onComplete();
        } catch {
            showError('Failed to submit exam');
            isSubmittingRef.current = false;
        }
    }, [attemptId, onComplete, showError, showSuccess]);

    // Initial setup — guarded against double-fire with hasFetchedRef
    useEffect(() => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        const startExam = async () => {
            try {
                const res = await api.post(`/exams/${examId}/attempt`);
                setAttemptId(res.data.attemptId);
                setQuestions(res.data.questions);
                setTimeLeft(res.data.exam.duration_minutes * 60);
                setIsLoading(false);
                setShowLaunchScreen(true);
            } catch (err) {
                showError(err.response?.data?.message || 'Failed to start exam');
                onComplete();
            }
        };
        startExam();
    }, [examId, onComplete, showError]);

    // Timer countdown
    useEffect(() => {
        if (!examStarted || timeLeft === null) return;
        if (timeLeft <= 0) {
            handleFinalSubmit();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [examStarted, timeLeft, handleFinalSubmit]);

    // Anti-Cheating Handler
    const handleViolation = (type) => {
        if (violationType) return;
        setViolationType(type);
        setWarningCount(prev => {
            const temp = prev + 1;
            if (temp > MAX_WARNINGS) handleFinalSubmit();
            return temp;
        });
    };

    useAntiCheating({ enabled: examStarted, onViolation: handleViolation });

    const handleOptionSelect = async (qId, option) => {
        setAnswers(prev => ({ ...prev, [qId]: option }));
        try {
            await api.post(`/exams/attempt/${attemptId}/save`, { question_id: qId, selected_option: option, text_answer: null });
        } catch (err) {
            console.error('Auto-save failed:', err);
        }
    };

    const handleTextAnswerChange = async (qId, text) => {
        setAnswers(prev => ({ ...prev, [qId]: text }));
        // For FIB, we send text_answer and null selected_option
        try {
            await api.post(`/exams/attempt/${attemptId}/save`, { question_id: qId, selected_option: null, text_answer: text });
        } catch (err) {
            console.error('Auto-save text failed:', err);
        }
    };

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const [fsError, setFsError] = useState(null);

    const handleLaunch = () => {
        console.log('[SecureExamInterface] handleLaunch triggered');
        setFsError(null);
        
        const el = document.documentElement;
        
        // Try standard or prefixed fullscreen
        const requestMethod = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        
        if (requestMethod) {
            console.log('[SecureExamInterface] Found request method, calling...');
            requestMethod.call(el)
                .then(() => {
                    console.log('[SecureExamInterface] Fullscreen request granted');
                    setShowLaunchScreen(false);
                    setExamStarted(true);
                })
                .catch(err => {
                    const msg = err?.message || 'Permission denied';
                    console.warn('[SecureExamInterface] Fullscreen error:', msg);
                    setFsError(`Access Denied: ${msg}. You MUST allow fullscreen to take this exam.`);
                    // DO NOT start exam if fullscreen fails
                });
        } else {
            console.warn('[SecureExamInterface] Fullscreen not supported');
            setFsError('CRITICAL: Your browser does not support the Fullscreen API. Please use a modern desktop browser.');
        }
    };

    // Heartbeat check for fullscreen status (Backup detection)
    useEffect(() => {
        if (!examStarted || violationType) return;

        const interval = setInterval(() => {
            const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
            if (!isFS) {
                console.log('[SecureExamInterface] Heartbeat detected exit from fullscreen');
                handleViolation('exited-fullscreen');
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [examStarted, violationType]);

    // Loading state
    if (isLoading) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center', height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h3>Preparing Secure Environment...</h3>
                <div className="spinner" style={{ margin: '1rem auto' }}></div>
            </div>
        );
    }

    // Launch screen - shown once after data loads
    if (showLaunchScreen) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h3 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--error)' }}>Restricted Exam Environment</h3>
                <p style={{ marginBottom: '2rem', maxWidth: '600px', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                    This exam requires a secure full-screen environment. You cannot exit full screen, switch tabs, copy text, or use external tools. Violations will trigger <strong>automatic warnings</strong> and submit your exam immediately upon reaching the limit.
                </p>
                <button
                    onClick={handleLaunch}
                    className="btn btn-primary"
                    style={{ fontSize: '1.2rem', padding: '1rem 3rem', background: 'var(--error)' }}
                >
                    Launch Secure Fullscreen Exam
                </button>
                {fsError && <p style={{ color: 'var(--error)', marginTop: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{fsError}</p>}
            </div>
        );
    }

    if (!examStarted || !questions.length) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
                <h3>Starting exam...</h3>
                <div className="spinner" style={{ margin: '1rem auto' }}></div>
            </div>
        );
    }

    const currentQ = questions[currentIndex];

    return (
        <div style={{ padding: '2rem', height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'var(--bg-gradient-start)', userSelect: 'none', WebkitUserSelect: 'none' }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: timeLeft < 60 ? 'var(--error)' : 'white' }}>
                    Time Left: {formatTime(timeLeft)}
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Question {currentIndex + 1} of {questions.length}</span>
                    <button onClick={handleFinalSubmit} className="btn btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
                        Finish Exam
                    </button>
                </div>
            </div>

            {violationType && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: '2rem'
                }}>
                    <div className="glass-panel" style={{ maxWidth: '500px', textAlign: 'center', border: '2px solid var(--error)' }}>
                        <h2 style={{ color: 'var(--error)', marginBottom: '1rem' }}>Security Violation!</h2>
                        <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                            {violationType === 'exited-fullscreen' ? 'You exited full-screen mode.' :
                                violationType === 'tab-switch' ? 'You switched tabs or minimized the window.' :
                                    'A security policy was violated.'}
                        </p>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                            <p style={{ fontWeight: 'bold', margin: 0 }}>
                                Warnings: {warningCount} / {MAX_WARNINGS + 1}
                            </p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                The exam will automatically submit at {MAX_WARNINGS + 1} warnings.
                            </p>
                        </div>
                        {warningCount <= MAX_WARNINGS && (
                            <button
                                onClick={async () => {
                                    try {
                                        if (!document.fullscreenElement) {
                                            await document.documentElement.requestFullscreen();
                                        }
                                    } catch (e) { console.warn(e); }
                                    setViolationType(null);
                                }}
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                            >
                                Return to Exam (Full Screen)
                            </button>
                        )}
                        {warningCount > MAX_WARNINGS && (
                            <p style={{ color: 'var(--error)', fontWeight: 'bold' }}>
                                Warning limit exceeded. Submitting exam...
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Question Area */}
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem', lineHeight: 1.5, margin: 0, flex: 1 }}>
                        {currentIndex + 1}. {currentQ.content}
                    </h3>
                    <span style={{ 
                        marginLeft: '1.5rem', 
                        padding: '0.4rem 0.8rem', 
                        background: 'rgba(79, 70, 229, 0.1)', 
                        color: 'var(--primary)', 
                        borderRadius: '8px', 
                        fontSize: '0.9rem', 
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                        border: '1px solid rgba(79, 70, 229, 0.2)'
                    }}>
                        {currentQ.marks || 1} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: 'auto' }}>
                    {(!currentQ.type || currentQ.type === 'mcq') && ['A', 'B', 'C', 'D'].map(opt => {
                        const optKey = `option_${opt.toLowerCase()}`;
                        return (
                            <label key={opt} style={{
                                display: 'flex', alignItems: 'center', padding: '1rem', background: answers[currentQ.id] === opt ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${answers[currentQ.id] === opt ? 'var(--primary)' : 'var(--border-subtle)'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                                <input
                                    type="radio"
                                    name={`q_${currentQ.id}`}
                                    value={opt}
                                    checked={answers[currentQ.id] === opt}
                                    onChange={() => handleOptionSelect(currentQ.id, opt)}
                                    style={{ marginRight: '1rem', transform: 'scale(1.2)' }}
                                />
                                <span style={{ fontSize: '1.1rem' }}>{opt}. {currentQ[optKey]}</span>
                            </label>
                        );
                    })}

                    {(currentQ.type === 'tf' || currentQ.type === 'true_false') && ['True', 'False'].map(opt => (
                        <label key={opt} style={{
                            display: 'flex', alignItems: 'center', padding: '1rem', background: answers[currentQ.id] === opt ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${answers[currentQ.id] === opt ? 'var(--primary)' : 'var(--border-subtle)'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                        }}>
                            <input
                                type="radio"
                                name={`q_${currentQ.id}`}
                                value={opt}
                                checked={answers[currentQ.id] === opt}
                                onChange={() => handleOptionSelect(currentQ.id, opt)}
                                style={{ marginRight: '1rem', transform: 'scale(1.2)' }}
                            />
                            <span style={{ fontSize: '1.1rem' }}>{opt}</span>
                        </label>
                    ))}

                    {currentQ.type === 'fib' && (
                        <div style={{ marginTop: '1rem' }}>
                            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Type your answer below (case-insensitive):</p>
                            <input
                                type="text"
                                className="glass-input"
                                style={{ width: '100%', fontSize: '1.2rem', padding: '1.2rem' }}
                                placeholder="Enter your answer here..."
                                value={answers[currentQ.id] || ''}
                                onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                                onBlur={(e) => handleTextAnswerChange(currentQ.id, e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                        className="btn btn-outline"
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                    >
                        ← Previous
                    </button>
                    {currentIndex < questions.length - 1 ? (
                        <button
                            className="btn btn-primary"
                            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                        >
                            Save & Next →
                        </button>
                    ) : (
                        <button className="btn btn-primary" style={{ background: 'var(--success)' }} onClick={handleFinalSubmit}>
                            Submit Final Answers
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecureExamInterface;
