import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Target, ClipboardList, LogOut, MessageSquare, Award, Settings, User } from 'lucide-react';
import api from '../utils/api';
import Materials from '../components/Student/Materials';
import TarsChat from '../components/Student/TarsChat';
import PracticeArena from '../components/Student/PracticeArena';
import ExamList from '../components/Student/ExamList';
import SecureExamInterface from '../components/Student/SecureExamInterface';
import ResultsView from '../components/Student/ResultsView';
import StudentProfile from '../components/Student/StudentProfile';
import SettingsView from '../components/Student/Settings';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // Views: 'profile', 'materials', 'chat', 'practice', 'exams', 'taking_exam'
    const [view, setView] = useState('profile');
    const [activeExamId, setActiveExamId] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.role !== 'student') {
            navigate('/teacher');
            return;
        }

        // Hide global navbar if on dashboard page
        document.body.classList.add('dashboard-view');

        // Fetch fresh user details to get section/department
        const fetchUserData = async () => {
            try {
                const res = await api.get('/auth/me');
                if (res.data.user) {
                    setUser(res.data.user);
                    localStorage.setItem('user', JSON.stringify(res.data.user));
                }
            } catch (err) {
                console.error("Failed to fetch fresh user data", err);
            }
        };
        fetchUserData();

        return () => document.body.classList.remove('dashboard-view');
    }, [navigate, user, user?.role]);

    const handleLogout = async () => {
        try {
            await api.delete('/chat');
        } catch (e) {
            console.error('Failed to clear chat on logout', e);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleStartExam = (examId) => {
        setActiveExamId(examId);
        setView('taking_exam');
    };

    const handleExamComplete = () => {
        setActiveExamId(null);
        setView('exams');
    };

    if (!user) return <div className="container" style={{ padding: '2rem' }}>Loading...</div>;

    // The entire exam blocks out the dashboard UI
    if (view === 'taking_exam') {
        return <SecureExamInterface examId={activeExamId} onComplete={handleExamComplete} />;
    }

    const navItems = [
        { id: 'profile', label: 'My Profile', icon: <User size={20} /> },
        { id: 'materials', label: 'Study Materials', icon: <BookOpen size={20} /> },
        { id: 'chat', label: 'TARS Chatbot', icon: <MessageSquare size={20} /> },
        { id: 'practice', label: 'Practice Arena', icon: <Target size={20} /> },
        { id: 'exams', label: 'Final Exams', icon: <ClipboardList size={20} /> },
        { id: 'results', label: 'My Results', icon: <Award size={20} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={20} /> }
    ];

    return (
        <div className="dashboard-wrapper">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '10px' }}>
                            <LayoutDashboard size={20} color="white" />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>LearnifyX Student</span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Section: {user.section || 'N/A'}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem',
                                background: view === item.id ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                                color: view === item.id ? 'var(--primary)' : 'var(--text-primary)',
                                border: '1px solid',
                                borderColor: view === item.id ? 'rgba(79, 70, 229, 0.3)' : 'transparent',
                                borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                                fontWeight: view === item.id ? '700' : '500',
                                fontSize: '1rem', transition: 'all 0.2s'
                            }}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem',
                            background: 'transparent', color: 'var(--error)',
                            border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                            fontSize: '1rem', fontWeight: '700', transition: 'all 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Viewport */}
            <main className="dashboard-main-viewport">
                <div className="dashboard-content-container">
                    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
                        {view === 'profile' && <StudentProfile user={user} />}
                        {view === 'materials' && <Materials onBack={() => setView('profile')} />}
                        {view === 'chat' && <TarsChat />}
                        {view === 'practice' && <PracticeArena onBack={() => setView('profile')} />}
                        {view === 'exams' && <ExamList onStartExam={handleStartExam} />}
                        {view === 'results' && <ResultsView />}
                        {view === 'settings' && <SettingsView user={user} onUserUpdate={setUser} />}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
