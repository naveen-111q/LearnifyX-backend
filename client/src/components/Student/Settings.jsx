import React, { useState } from 'react';
import api from '../../utils/api';
import { Palette, User, Save, CheckCircle } from 'lucide-react';

const Settings = ({ user, onUserUpdate }) => {
    const [name, setName] = useState(user?.name || '');
    const [section, setSection] = useState(user?.section || '');
    // Use user-specific key so different students don't share the same theme
    const themeKey = `theme_student_${user?.id || 'default'}`;
    const [theme, setTheme] = useState(localStorage.getItem(themeKey) || 'dark');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const themes = [
        { id: 'dark', label: 'Default Dark', color: '#0f172a' },
        { id: 'dark-gold', label: 'Midnight Gold', color: '#000000' },
        { id: 'light-forest', label: 'Forest Green', color: '#ECFDF5' },
        { id: 'light-rose', label: 'Rose White', color: '#FFFFFF' }
    ];

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem(themeKey, newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleSectionChange = (e) => {
        const val = e.target.value.toUpperCase();
        // Only allow alphabets
        if (val === '' || /^[A-Z]+$/.test(val)) {
            setSection(val);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await api.put('/auth/profile', { name, section });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            
            // Update local user state
            const updatedUser = { ...user, name, section };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            onUserUpdate(updatedUser);
        } catch (err) {
            const errorMsg = err.response?.data?.details 
                ? `${err.response.data.message}: ${err.response.data.details}`
                : (err.response?.data?.message || 'Failed to update profile');
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
            setIsEditing(false);
        }
    };

    return (
        <div className="glass-panel animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Palette size={24} className="icon-primary" />
                Settings
            </h2>

            {message.text && (
                <div className={`alert alert-${message.type}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {message.type === 'success' && <CheckCircle size={18} />}
                    {message.text}
                </div>
            )}

            <section style={{ marginBottom: '3rem' }}>
                <h4 style={{ marginBottom: '1.25rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Appearance
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    {themes.map(t => (
                        <div 
                            key={t.id}
                            onClick={() => handleThemeChange(t.id)}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: `2px solid ${theme === t.id ? 'var(--primary)' : 'var(--border-subtle)'}`,
                                borderRadius: '12px',
                                padding: '1rem',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ 
                                width: '40px', height: '40px', borderRadius: '50%', background: t.color, 
                                margin: '0 auto 0.75rem auto', border: '1px solid rgba(255,255,255,0.1)' 
                            }}></div>
                            <span style={{ fontSize: '0.9rem', fontWeight: theme === t.id ? '600' : '400' }}>{t.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h4 style={{ marginBottom: '1.25rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Profile Information
                </h4>
                {!isEditing ? (
                    <div style={{ background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</span>
                                <div style={{ fontSize: '1.1rem', fontWeight: '500', marginTop: '0.25rem', color: 'var(--text-primary)' }}>{name || 'Not provided'}</div>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section Details</span>
                                <div style={{ fontSize: '1.1rem', fontWeight: '500', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                                    {section ? `CSE - ${section}` : 'Not provided'}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSave} style={{ display: 'grid', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="input-group">
                            <label className="input-label">Full Name</label>
                            <input 
                                type="text" 
                                className="glass-input" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Section (Alphabets Only)</label>
                            <input 
                                type="text" 
                                className="glass-input" 
                                value={section} 
                                onChange={handleSectionChange}
                                placeholder="e.g. A"
                                maxLength="5"
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                Updated section will be fetched in the profile: CSE - {section || '...'}
                            </p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.75rem 1.5rem' }}>
                                {loading ? 'Saving...' : (
                                    <>
                                        <Save size={18} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-outline" 
                                disabled={loading}
                                onClick={() => {
                                    setIsEditing(false);
                                    setName(user?.name || '');
                                    setSection(user?.section || '');
                                    setMessage({ type: '', text: '' });
                                }} 
                                style={{ padding: '0.75rem 1.5rem' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {!isEditing && (
                    <button 
                        type="button" 
                        className="btn btn-outline" 
                        onClick={() => setIsEditing(true)} 
                        style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    >
                        <User size={18} />
                        Edit Profile Information
                    </button>
                )}
            </section>
        </div>
    );
};

export default Settings;
