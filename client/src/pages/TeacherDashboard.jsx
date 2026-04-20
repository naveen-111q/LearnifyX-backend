import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PenTool, BarChart, LogOut, LayoutDashboard, User, Settings, Users, ClipboardList } from 'lucide-react';
import SubjectManager from '../components/Teacher/SubjectManager';
import TopicManager from '../components/Teacher/TopicManager';
import QuestionManager from '../components/Teacher/QuestionManager';
import MaterialManager from '../components/Teacher/MaterialManager';
import ExamManager from '../components/Teacher/ExamManager';
import ManageExam from '../components/Teacher/ManageExam';
import TeacherProfile from '../components/Teacher/TeacherProfile';
import StudentInfo from '../components/Teacher/StudentInfo';
import TeacherResults from '../components/Teacher/TeacherResults';
import TeacherSettings from '../components/Teacher/TeacherSettings';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    
    // View state: 'profile', 'subjects', 'topics', 'questions', 'materials', 'exams'
    const [view, setView] = useState('profile');
    const [activeSubject, setActiveSubject] = useState(null);
    const [activeTopic, setActiveTopic] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        if (user.role !== 'teacher') {
            navigate('/student');
            return;
        }

        // Hide global navbar if on dashboard page
        document.body.classList.add('dashboard-view');
        return () => document.body.classList.remove('dashboard-view');
    }, [navigate, user]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    if (!user) return <div className="container" style={{padding: '2rem'}}>Loading...</div>;

    const navigateToTopics = (subject) => {
        setActiveSubject(subject);
        setView('topics');
    };

    const navigateFromTopic = (topic, targetView) => {
        setActiveTopic(topic);
        setView(targetView);
    };

    const isCurriculumHub = ['subjects', 'topics', 'questions', 'materials'].includes(view);

    const navItems = [
        { id: 'profile', label: 'Faculty Profile', icon: <User size={20} />, active: view === 'profile' },
        { id: 'curriculum', label: 'Subjects', icon: <BookOpen size={20} />, active: isCurriculumHub, onClick: () => { setView('subjects'); setActiveSubject(null); setActiveTopic(null); } },
        { id: 'students', label: 'Student Info', icon: <Users size={20} />, active: view === 'students', onClick: () => { setView('students'); setActiveSubject(null); setActiveTopic(null); } },
        { id: 'exams', label: 'Create Final Exam', icon: <PenTool size={20} />, active: view === 'exams' },
        { id: 'manage_exam', label: 'Manage Final Exam', icon: <ClipboardList size={20} />, active: view === 'manage_exam' },
        { id: 'results', label: 'View Results', icon: <BarChart size={20} />, active: view === 'results', onClick: () => { setView('results'); setActiveSubject(null); setActiveTopic(null); } },
        { id: 'settings', label: 'Settings', icon: <Settings size={20} />, active: view === 'settings', onClick: () => { setView('settings'); setActiveSubject(null); setActiveTopic(null); } },
    ];

    return (
        <div className="dashboard-wrapper">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ background: 'var(--secondary)', padding: '0.5rem', borderRadius: '10px' }}>
                            <LayoutDashboard size={20} color="white" />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>LearnifyX Faculty</span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>Prof. {user.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Senior Educator</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {navItems.map(item => (
                        <button 
                            key={item.id}
                            onClick={item.onClick || (() => setView(item.id))}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem',
                                background: item.active ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                                color: item.active ? 'var(--secondary)' : 'var(--text-primary)',
                                border: '1px solid',
                                borderColor: item.active ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
                                borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                                fontWeight: item.active ? '700' : '500', 
                                fontSize: '1rem', transition: 'all 0.2s'
                            }}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
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
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Viewport */}
            <main className="dashboard-main-viewport">
                <div className="dashboard-content-container">
                    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
                        {view === 'profile' && <TeacherProfile user={user} />}
                        {view === 'subjects' && <SubjectManager onSelectSubject={navigateToTopics} />}
                        {view === 'topics' && <TopicManager subject={activeSubject} onBack={() => setView('subjects')} onSelectTopic={navigateFromTopic} />}
                        {view === 'questions' && <QuestionManager topic={activeTopic} onBack={() => setView('topics')} />}
                        {view === 'materials' && <MaterialManager topic={activeTopic} onBack={() => setView('topics')} />}
                        {view === 'exams' && <ExamManager />}
                        {view === 'students' && <StudentInfo />}
                        {view === 'results' && <TeacherResults />}
                        {view === 'manage_exam' && <ManageExam />}
                        {view === 'settings' && <TeacherSettings user={user} />}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TeacherDashboard;
