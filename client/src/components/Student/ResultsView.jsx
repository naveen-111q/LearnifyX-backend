import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Award, CheckCircle, Clock } from 'lucide-react';

const ResultsView = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await api.get('/exams/student/results');
                setResults(res.data);
            } catch (err) {
                console.error("Failed to fetch results", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    return (
        <div className="glass-panel animate-fade-in">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Award className="icon-primary" size={24} />
                My Exam Results
            </h3>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>Review your performance across your completed final exams.</p>
            
            {loading ? (
                <div className="spinner"></div>
            ) : results.length === 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>No results available yet. Complete exams to see your scores here.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                    {results.map((result) => {
                        const percentage = ((result.total_score / result.total_marks) * 100).toFixed(1);
                        
                         return (
                            <div key={result.attempt_id} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                background: 'rgba(255,255,255,0.05)', 
                                padding: '1.5rem', 
                                borderRadius: '16px', 
                                borderLeft: `6px solid var(--primary)`,
                                transition: 'transform 0.2s',
                                cursor: 'default'
                            }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{result.exam_title}</h4>
                                    <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Award size={16} /> {result.subject_name}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Clock size={16} /> Completed: {new Date(result.end_time).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'flex-end',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: 1 }}>
                                        {percentage}%
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--primary)', marginTop: '0.5rem' }}>
                                        Score: {result.total_score} / {result.total_marks}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ResultsView;
