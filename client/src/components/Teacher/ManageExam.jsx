import React, { useState, useEffect } from 'react';
import { ClipboardList, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';


const ManageExam = () => {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [students, setStudents] = useState([]);
    const [loadingExams, setLoadingExams] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // student id being actioned
    const [message, setMessage] = useState({ type: '', text: '' });
    const { showError } = useNotification();


    // Reschedule modal state
    const [rescheduleModal, setRescheduleModal] = useState(null); // { student } or null
    const [rescheduleForm, setRescheduleForm] = useState({ exam_date: '', start_time: '', end_time: '' });

    // Load teacher's exams
    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/exams');
                setExams(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingExams(false);
            }
        };
        fetchExams();
    }, []);

    // Load students & their attempt status when an exam is selected
    const loadStudents = async (exam) => {
        setSelectedExam(exam);
        setStudents([]);
        setMessage({ type: '', text: '' });
        setLoadingStudents(true);
        try {
            const res = await api.get(`/exams/${exam.id}/results`);
            setStudents(res.data.results || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleReschedule = async (student) => {
        // Open the modal instead of window.confirm
        setRescheduleModal(student);
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Format current time and 1-hour-later time for defaults
        const formatTime = (date) => {
            const h = String(date.getHours()).padStart(2, '0');
            const m = String(date.getMinutes()).padStart(2, '0');
            return `${h}:${m}`;
        };

        const startTime = formatTime(now);
        const later = new Date(now.getTime() + 60 * 60 * 1000);
        const endTime = formatTime(later);

        setRescheduleForm({ exam_date: today, start_time: startTime, end_time: endTime });
    };

    const confirmReschedule = async () => {
        const student = rescheduleModal;
        const { exam_date, start_time, end_time } = rescheduleForm;
        if (!exam_date || !start_time || !end_time) {
            showError('Please fill in all fields.');
            return;
        }

        setRescheduleModal(null);
        setActionLoading(student.student_id);
        setMessage({ type: '', text: '' });
        try {
            await api.post(`/exams/${selectedExam.id}/reschedule/${student.student_id}`, { exam_date, start_time, end_time });
            setMessage({ type: 'success', text: `✓ ${student.name}'s exam has been rescheduled on ${exam_date} from ${start_time} to ${end_time}.` });
            await loadStudents(selectedExam);
        } catch (e) {
            setMessage({ type: 'error', text: e.response?.data?.message || 'Failed to reschedule.' });
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status) => {
        if (!status || status === null) return { label: 'Not Attempted', color: 'var(--text-secondary)', bg: 'rgba(148,163,184,0.1)', icon: <XCircle size={14} /> };
        return { label: 'Attempted', color: 'var(--success)', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle size={14} /> };
    };

    return (
        <div className="animate-fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <ClipboardList size={24} className="icon-primary" />
                    Manage Final Exams
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    Select an exam to view student statuses. You can reset access for absentees or students with technical issues.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedExam ? '280px 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Exam List */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Exams</h4>
                    {loadingExams ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading...</p>
                    ) : exams.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No exams created yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {exams.map(exam => (
                                <button
                                    key={exam.id}
                                    onClick={() => loadStudents(exam)}
                                    style={{
                                        textAlign: 'left', padding: '0.75rem 1rem',
                                        background: selectedExam?.id === exam.id ? 'rgba(79,70,229,0.15)' : 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${selectedExam?.id === exam.id ? 'var(--primary)' : 'var(--border-subtle)'}`,
                                        borderRadius: '10px', cursor: 'pointer', width: '100%',
                                        color: selectedExam?.id === exam.id ? 'var(--primary)' : 'var(--text-primary)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{exam.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        Section: {exam.allowed_section || 'All'} · {exam.total_marks} marks
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Students Panel */}
                {selectedExam && (
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{selectedExam.title}</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Section: {selectedExam.allowed_section || 'All'} · Total: {selectedExam.total_marks} marks
                                </p>
                            </div>
                        </div>

                        {message.text && (
                            <div style={{
                                padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem',
                                background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--error)'}`,
                                color: message.type === 'success' ? 'var(--success)' : 'var(--error)',
                                fontSize: '0.9rem'
                            }}>
                                {message.text}
                            </div>
                        )}

                        {loadingStudents ? (
                            <p style={{ color: 'var(--text-secondary)' }}>Loading students...</p>
                        ) : students.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)' }}>No students found for this exam's section.</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                            {['Student Name', 'Section', 'Status', 'Score', 'Action'].map(h => (
                                                <th key={h} style={{ textAlign: 'left', padding: '0.6rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((s, i) => {
                                            const badge = getStatusBadge(s.attempt_status);
                                            // const canReset = s.attempt_status !== null; // can reset if they've started or completed
                                            return (
                                                <tr key={s.student_id} style={{ borderBottom: '1px solid var(--border-subtle)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                                    <td style={{ padding: '0.85rem 1rem', fontWeight: '500' }}>{s.name}</td>
                                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{s.section || '-'}</td>
                                                    <td style={{ padding: '0.85rem 1rem' }}>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.65rem', borderRadius: '20px', background: badge.bg, color: badge.color, fontSize: '0.8rem', fontWeight: '600' }}>
                                                            {badge.icon} {badge.label}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.85rem 1rem' }}>
                                                        {s.attempt_status === 'completed' && s.total_score !== null
                                                            ? <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{s.total_score} / {selectedExam.total_marks}</span>
                                                            : <span style={{ color: 'var(--text-secondary)' }}>—</span>
                                                        }
                                                    </td>
                                                    <td style={{ padding: '0.85rem 1rem' }}>
                                                        <button
                                                            onClick={() => handleReschedule(s)}
                                                            disabled={actionLoading === s.student_id}
                                                            style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                                                padding: '0.4rem 0.9rem', borderRadius: '8px', fontSize: '0.8rem',
                                                                fontWeight: '600', cursor: 'pointer', border: '1px solid',
                                                                background: 'rgba(245,158,11,0.1)',
                                                                borderColor: 'rgba(245,158,11,0.4)',
                                                                color: '#F59E0B',
                                                                opacity: actionLoading === s.student_id ? 0.6 : 1,
                                                                transition: 'all 0.2s'
                                                            }}
                                                            title="Reset exam access so this student can retake"
                                                        >
                                                            <RefreshCw size={13} />
                                                            {actionLoading === s.student_id ? 'Resetting...' : 'Reset Access'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                                    💡 Resetting a student's access will erase their previous attempt and allow them to retake the exam fresh.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Reschedule Modal */}
            {rescheduleModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div className="glass-panel" style={{ maxWidth: '450px', width: '100%', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Reschedule Exam</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Setting a custom window for <strong>{rescheduleModal.name}</strong>.
                        </p>

                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div className="input-group">
                                <label className="input-label">Exam Date</label>
                                <input
                                    type="date"
                                    className="glass-input"
                                    value={rescheduleForm.exam_date}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, exam_date: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Start Time (24h)</label>
                                    <input
                                        type="time"
                                        className="glass-input"
                                        value={rescheduleForm.start_time}
                                        onChange={(e) => setRescheduleForm({ ...rescheduleForm, start_time: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">End Time (24h)</label>
                                    <input
                                        type="time"
                                        className="glass-input"
                                        value={rescheduleForm.end_time}
                                        onChange={(e) => setRescheduleForm({ ...rescheduleForm, end_time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-0.5rem' }}>
                                💡 Use 24-hour format (e.g., 15:30 for 3:30 PM).
                            </p>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={confirmReschedule}
                                    style={{ flex: 1 }}
                                >
                                    Confirm Reschedule
                                </button>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setRescheduleModal(null)}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageExam;
