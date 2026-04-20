import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    CheckCircle,
    XCircle,
    LogOut,
    ShieldCheck,
    Activity,
    UserCheck,
    Search,
    RefreshCw,
    Clock,
    GraduationCap,
    Edit3,
    X,
    Save,
    Trash2,
    Plus
} from 'lucide-react';
import api from '../utils/api';
import { useNotification } from '../context/NotificationContext';


const CreateUserModal = ({ role, onClose, onSave, loading }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        section: ''
    });

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
            <div style={{
                background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border-strong)',
                padding: '2.5rem', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Add New {role === 'teacher' ? 'Teacher' : 'Student'}</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name</label>
                        <input
                            type="text"
                            placeholder="Enter full name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-strong)', color: 'white' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address</label>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-strong)', color: 'white' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Section (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. CS-1"
                            value={formData.section}
                            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                            style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-strong)', color: 'white' }}
                        />
                    </div>
                    <div style={{ padding: '0.75rem', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Clock size={16} color="var(--primary)" />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Default Password: <strong>Welcome123</strong></span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border-strong)', color: 'white', cursor: 'pointer' }}>Cancel</button>
                    <button
                        onClick={() => onSave({ ...formData, role })}
                        disabled={loading}
                        style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        {loading ? <RefreshCw size={18} className="animate-spin" /> : <><Plus size={18} /> Create Account</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const EditUserModal = ({ user, onClose, onSave, onDelete, loading }) => {
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        section: user.section || ''
    });

    if (!user) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
            <div style={{
                background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border-strong)',
                padding: '2.5rem', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Edit {user.role === 'teacher' ? 'Teacher' : 'Student'}</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-strong)', color: 'white' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-strong)', color: 'white' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Section</label>
                        <input
                            type="text"
                            placeholder="e.g. A, B, CS-1"
                            value={formData.section}
                            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                            style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-strong)', color: 'white' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                    <button
                        onClick={() => onDelete(user.id)}
                        disabled={loading}
                        style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: 'pointer' }}
                        title="Delete Account"
                    >
                        <Trash2 size={20} />
                    </button>
                    <button
                        onClick={onClose}
                        style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border-strong)', color: 'white', cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(formData)}
                        disabled={loading}
                        style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        {loading ? <RefreshCw size={18} className="animate-spin" /> : <><Save size={18} /> Update</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();
    const [user] = useState(() => {

        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [activeView, setActiveView] = useState('teachers'); // 'teachers' | 'students'
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchData();
        // Hide global navbar if on dashboard page
        document.body.classList.add('dashboard-view');
        return () => document.body.classList.remove('dashboard-view');
    }, [navigate, user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [teachersRes, studentsRes, statsRes] = await Promise.all([
                api.get('/admin/teachers'),
                api.get('/admin/students'),
                api.get('/admin/stats')
            ]);
            setTeachers(teachersRes.data);
            setStudents(studentsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (teacherId, isApproved) => {
        setActionLoading(teacherId);
        try {
            await api.put('/admin/verify-teacher', { teacherId, isApproved });
            showSuccess(`Teacher ${isApproved ? 'authorized' : 'revoked'} successfully`);
            fetchData();
        } catch {
            showError("Failed to update teacher status");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (teacherId) => {
        if (!window.confirm("Are you sure you want to reject this teacher? Their account will be permanently deleted.")) return;

        setActionLoading(teacherId);
        try {
            await api.delete(`/admin/user/${teacherId}`);
            setTeachers(prev => prev.filter(t => t.id !== teacherId));
            showSuccess("Teacher account deleted");
            fetchData();
        } catch {
            showError("Failed to delete account");
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateUser = async (formData) => {
        setActionLoading(editingUser.id);
        try {
            await api.put(`/admin/update-user/${editingUser.id}`, formData);
            setEditingUser(null);
            showSuccess("User profile updated");
            fetchData();
        } catch (error) {
            showError(error.response?.data?.message || "Failed to update user");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("CRITICAL: Are you sure you want to PERMANENTLY delete this account? This action cannot be undone.")) return;

        setActionLoading(userId);
        try {
            await api.delete(`/admin/user/${userId}`);
            setEditingUser(null);
            showSuccess("Account permanently deleted");
            fetchData();
        } catch {
            showError("Failed to delete account");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateUser = async (formData) => {
        setActionLoading('creating');
        try {
            await api.post('/admin/create-user', formData);
            setIsCreateModalOpen(false);
            showSuccess("New account created successfully");
            fetchData();
        } catch (error) {
            showError(error.response?.data?.message || "Failed to create user");
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const currentData = activeView === 'teachers' ? teachers : students;
    const filteredData = currentData.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user) return null;

    return (
        <div className="dashboard-wrapper">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '10px' }}>
                            <ShieldCheck size={20} color="white" />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>LearnifyX Control</span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>{user.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>System Administrator</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                        onClick={() => setActiveView('teachers')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem',
                            background: activeView === 'teachers' ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                            color: activeView === 'teachers' ? 'var(--primary)' : 'var(--text-primary)',
                            border: '1px solid',
                            borderColor: activeView === 'teachers' ? 'rgba(79, 70, 229, 0.3)' : 'transparent',
                            borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                            fontWeight: activeView === 'teachers' ? '700' : '500',
                            fontSize: '1rem', transition: 'all 0.2s'
                        }}
                    >
                        <UserCheck size={20} />
                        Teacher Records
                    </button>

                    <button
                        onClick={() => setActiveView('students')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem',
                            background: activeView === 'students' ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                            color: activeView === 'students' ? 'var(--primary)' : 'var(--text-primary)',
                            border: '1px solid',
                            borderColor: activeView === 'students' ? 'rgba(79, 70, 229, 0.3)' : 'transparent',
                            borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                            fontWeight: activeView === 'students' ? '700' : '500',
                            fontSize: '1rem', transition: 'all 0.2s'
                        }}
                    >
                        <GraduationCap size={20} />
                        Student Records
                    </button>
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
                    {/* Header Action Section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white' }}>
                                {activeView === 'teachers' ? 'Faculty Directory' : 'Student Management'}
                            </h1>
                            <p style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
                                {activeView === 'teachers' ? 'Monitor and authorize academic staff access.' : 'Oversee student enrollment and class sections.'}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.5rem', borderRadius: '14px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '700', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}
                            >
                                <Plus size={20} />
                                New {activeView === 'teachers' ? 'Teacher' : 'Student'}
                            </button>
                            <button
                                onClick={fetchData}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.5rem', borderRadius: '14px', background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'white', cursor: 'pointer', fontWeight: '600' }}
                            >
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                                Sync
                            </button>
                        </div>
                    </div>

                    {/* Stats Dashboard */}
                    {stats && (
                        <div className="dashboard-stats-grid">
                            <div className="dashboard-stat-card">
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Students</span>
                                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginTop: '0.5rem' }}>{stats.studentCount}</div>
                                <div style={{ height: '4px', width: '40px', background: 'var(--primary)', marginTop: '0.75rem', borderRadius: '2px' }}></div>
                            </div>
                            <div className="dashboard-stat-card">
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Verified Faculty</span>
                                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--secondary)', marginTop: '0.5rem' }}>{stats.approvedTeacherCount}</div>
                                <div style={{ height: '4px', width: '40px', background: 'var(--secondary)', marginTop: '0.75rem', borderRadius: '2px' }}></div>
                            </div>
                            <div className="dashboard-stat-card">
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Action Required</span>
                                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#f59e0b', marginTop: '0.5rem' }}>{stats.pendingTeacherCount}</div>
                                <div style={{ height: '4px', width: '40px', background: '#f59e0b', marginTop: '0.75rem', borderRadius: '2px' }}></div>
                            </div>
                        </div>
                    )}

                    {/* Managed Roster Table */}
                    <div className="dashboard-card">
                        <div style={{ padding: '1.75rem 2.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>{activeView === 'teachers' ? 'Teacher Accounts' : 'Student Registry'}</h2>
                            <div style={{ position: 'relative' }}>
                                <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="text" placeholder={`Search ${activeView}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ padding: '0.8rem 1.25rem 0.8rem 3.25rem', borderRadius: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-strong)', color: 'white', width: '350px', fontSize: '1rem', outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>User Details</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Contact</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{activeView === 'students' ? 'Division' : 'Verification'}</th>
                                        <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Management</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length === 0 ? (
                                        <tr><td colSpan="4" style={{ padding: '6rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
                                                <Users size={48} opacity={0.2} />
                                                <p style={{ fontSize: '1.1rem' }}>{loading ? 'Decrypting encrypted records...' : `No records found in the current ${activeView} partition.`}</p>
                                            </div>
                                        </td></tr>
                                    ) : (
                                        filteredData.map((item) => (
                                            <tr key={item.id} style={{ borderTop: '1px solid var(--border-subtle)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                                <td style={{ padding: '1.5rem 2.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--primary), #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>
                                                            {item.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'white' }}>{item.name}</div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Reg. {new Date(item.created_at).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.5rem 2.5rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>{item.email}</td>
                                                <td style={{ padding: '1.5rem 2.5rem' }}>
                                                    {activeView === 'students' ? (
                                                        <div style={{ display: 'inline-block', padding: '0.35rem 0.85rem', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', fontWeight: '800' }}>
                                                            {item.section || 'Unassigned'}
                                                        </div>
                                                    ) : (
                                                        item.is_approved ?
                                                            <span style={{ color: '#10b981', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle size={16} /> Verified Role</span> :
                                                            <span style={{ color: '#f59e0b', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={16} /> Review Needed</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1.5rem 2.5rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                                        <button
                                                            onClick={() => setEditingUser({ ...item, role: activeView === 'teachers' ? 'teacher' : 'student' })}
                                                            style={{ padding: '0.65rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-strong)', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
                                                            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                                            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                                                        >
                                                            <Edit3 size={18} />
                                                        </button>

                                                        {activeView === 'teachers' && (
                                                            item.is_approved ? (
                                                                <button onClick={() => handleVerify(item.id, false)} style={{ padding: '0.65rem 1rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '800' }}>Revoke</button>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => handleVerify(item.id, true)} style={{ padding: '0.65rem 1rem', borderRadius: '10px', background: 'var(--secondary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '800' }}>Authorize</button>
                                                                    <button onClick={() => handleReject(item.id)} style={{ padding: '0.65rem 1rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '800' }}>Reject</button>
                                                                </>
                                                            )
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals Positioning Container */}
            <div id="dashboard-portal-container">
                {editingUser && (
                    <EditUserModal
                        user={editingUser}
                        onClose={() => setEditingUser(null)}
                        onSave={handleUpdateUser}
                        onDelete={handleDeleteUser}
                        loading={actionLoading === editingUser.id}
                    />
                )}

                {isCreateModalOpen && (
                    <CreateUserModal
                        role={activeView === 'teachers' ? 'teacher' : 'student'}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSave={handleCreateUser}
                        loading={actionLoading === 'creating'}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
