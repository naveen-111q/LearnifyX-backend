import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const ExamList = ({ onStartExam }) => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/exams');
                setExams(res.data);
            } catch (err) {
                console.error("Failed to fetch exams", err);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();

        // Refresh exact time every 10 seconds to unlock exams
        const timer = setInterval(() => setNow(new Date()), 10000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="glass-panel animate-fade-in">
            <h3>Final Exams</h3>
            <p style={{ marginBottom: '2rem' }}>You have exactly one attempt for these exams. You can only start during the scheduled window.</p>

            {loading ? <div className="spinner"></div> : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {exams.length === 0 ? <p>No exams available at the moment.</p> : null}
                    {exams.map(exam => {
                        // let isScheduled = false;
                        let isClosed = false;
                        let isOpen = false;

                        let dateStr = "Unknown";
                        let btnText = "Start Attempt";

                        if (exam.exam_date) {
                            const d = new Date(exam.exam_date);
                            const examDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                            const examStart = new Date(`${examDateStr}T${exam.start_time}`);
                            const examEnd = new Date(`${examDateStr}T${exam.end_time}`);

                            if (now < examStart) {
                                // isScheduled = true;
                                btnText = `Opens at ${exam.start_time}`;
                            } else if (now > examEnd) {
                                isClosed = true;
                                btnText = "Closed";
                            } else {
                                isOpen = true;
                            }
                            dateStr = new Date(exam.exam_date).toLocaleDateString();
                        }

                        if (exam.attempt_status || isClosed) {
                            // "if student attempted or submitted [...] doesn't show again"
                            // "if it is time end time is completed [...] doesn't show again"
                            return null;
                        }

                        return (
                            <div key={exam.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', borderLeft: isOpen ? '4px solid var(--success)' : (isClosed ? '4px solid var(--error)' : '4px solid var(--text-secondary)') }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{exam.title}</h4>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                        Subject: {exam.subject_name} • Date: {dateStr} • Window: {exam.start_time} - {exam.end_time} • Total Marks: {exam.total_marks}
                                    </div>
                                </div>
                                <button
                                    className={`btn ${isOpen ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => onStartExam(exam.id)}
                                    disabled={!isOpen}
                                    style={{ opacity: !isOpen ? 0.6 : 1, cursor: !isOpen ? 'not-allowed' : 'pointer' }}
                                >
                                    {btnText}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ExamList;
