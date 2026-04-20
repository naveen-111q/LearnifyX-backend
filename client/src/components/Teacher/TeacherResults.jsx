import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { BarChart, Search, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';

const TeacherResults = () => {
    const [exams, setExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [results, setResults] = useState(null);
    const [examTitle, setExamTitle] = useState('');
    const [totalMarks, setTotalMarks] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/exams');
                setExams(res.data);
                if (res.data.length > 0) {
                    setSelectedExamId(res.data[0].id);
                }
            } catch (err) {
                console.error("Failed to load exams", err);
                setError("Failed to load your published exams.");
            }
        };
        fetchExams();
    }, []);

    useEffect(() => {
        if (!selectedExamId) return;
        
        const fetchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get(`/exams/${selectedExamId}/results`);
                setExamTitle(res.data.exam);
                setTotalMarks(res.data.totalMarks || 0);
                
                // Deduplicate results: if student has multiple attempts, prioritize completed/highest score
                const uniqueResultsMap = new Map();
                res.data.results.forEach(r => {
                    const existing = uniqueResultsMap.get(r.student_id);
                    if (!existing) {
                        uniqueResultsMap.set(r.student_id, r);
                    } else {
                        if (r.attempt_status === 'completed' && existing.attempt_status !== 'completed') {
                            uniqueResultsMap.set(r.student_id, r);
                        } else if (r.attempt_status === 'completed' && existing.attempt_status === 'completed') {
                            if (r.total_score > existing.total_score) {
                                uniqueResultsMap.set(r.student_id, r);
                            }
                        }
                    }
                });
                const finalResults = Array.from(uniqueResultsMap.values()).sort((a, b) => {
                    const scoreA = a.total_score !== null ? a.total_score : -1;
                    const scoreB = b.total_score !== null ? b.total_score : -1;
                    return scoreB - scoreA; // highest score first
                });
                setResults(finalResults);
            } catch (err) {
                console.error("Failed to load results", err);
                setError("Failed to load student results for this exam.");
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [selectedExamId]);

    const filteredResults = results ? results.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (r.section && r.section.toLowerCase().includes(searchQuery.toLowerCase()))
    ) : [];

    return (
        <div className="glass-panel animate-fade-in">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <BarChart className="icon-primary" size={24} />
                Student Exam Results
            </h3>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                Select an exam to view the full student roster and tracking performance.
            </p>

            {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div className="input-group" style={{ flex: 1, minWidth: '250px' }}>
                    <label className="input-label">Select Exam</label>
                    <select 
                        className="glass-input select-input" 
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        disabled={exams.length === 0}
                    >
                        {exams.length === 0 && <option value="">No exams available</option>}
                        {exams.map(exam => (
                            <option key={exam.id} value={exam.id}>{exam.title}</option>
                        ))}
                    </select>
                </div>
                
                <div className="input-group" style={{ flex: 1, minWidth: '250px' }}>
                    <label className="input-label">Search Student</label>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input 
                            type="text" 
                            className="glass-input" 
                            style={{ paddingLeft: '2.75rem' }} 
                            placeholder="Search by name or section..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="spinner"></div>
            ) : !results ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Please select an exam to view results.
                </div>
            ) : (
                <>
                    <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                        Results for: <span style={{ color: 'var(--primary)' }}>{examTitle}</span>
                    </h4>
                    
                    {filteredResults.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No matching students found.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                                        <th style={{ padding: '1rem 0.5rem' }}>Student Name</th>
                                        <th style={{ padding: '1rem 0.5rem' }}>Section</th>
                                        <th style={{ padding: '1rem 0.5rem' }}>Status</th>
                                        <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResults.map((student, idx) => (
                                        <tr key={student.student_id} style={{ 
                                            borderBottom: idx !== filteredResults.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                        }}>
                                            <td style={{ padding: '1rem 0.5rem', fontWeight: '500' }}>{student.name}</td>
                                            <td style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>{student.section || '-'}</td>
                                            <td style={{ padding: '1rem 0.5rem' }}>
                                                {student.attempt_status === 'completed' ? (
                                                    <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: '600' }}>
                                                        <CheckCircle size={14} /> Attempted
                                                    </span>
                                                ) : student.is_rescheduled ? (
                                                    <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: '600' }}>
                                                        <RefreshCw size={14} /> Rescheduled
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: '600' }}>
                                                        <XCircle size={14} /> Not Attempted
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                                                {student.total_score !== null ? `${student.total_score} / ${totalMarks}` : '--'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TeacherResults;
