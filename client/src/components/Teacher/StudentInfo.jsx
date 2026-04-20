import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Users, Mail, User, Bookmark } from 'lucide-react';

const StudentInfo = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get('/auth/students');
                setStudents(res.data);
            } catch (err) {
                console.error("Failed to fetch students", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    return (
        <div className="glass-panel animate-fade-in">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Users className="icon-primary" size={24} />
                Student Information
            </h3>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                View the roster of all registered students in the system.
            </p>

            {loading ? (
                <div className="spinner"></div>
            ) : students.length === 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>No students have registered yet.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {students.map(student => (
                        <div key={student.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '1.25rem',
                            borderRadius: '12px',
                            border: '1px solid var(--border-subtle)',
                            transition: 'all 0.2s',
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-strong)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}>
                            <div style={{ 
                                width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(79, 70, 229, 0.2)', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                                marginRight: '1.5rem', flexShrink: 0
                            }}>
                                <User size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{student.name}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <Mail size={14} />
                                    {student.email}
                                </div>
                            </div>
                            <div style={{
                                padding: '0.5rem 1rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: student.section ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}>
                                <Bookmark size={16} className={student.section ? "icon-primary" : ""} />
                                {student.section ? `Section ${student.section}` : 'Unassigned'}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentInfo;
