import React, { useState } from 'react';
import { Palette, User, Settings, Moon, Sun, Sparkles, Leaf, CheckCircle2 } from 'lucide-react';

const themes = [
    {
        id: 'dark',
        label: 'Default Dark',
        description: 'Deep indigo night',
        bg: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
        accent: '#4F46E5',
        icon: <Moon size={18} />,
    },
    {
        id: 'dark-gold',
        label: 'Midnight Gold',
        description: 'Black with golden glow',
        bg: 'linear-gradient(135deg, #000000, #1F2937)',
        accent: '#D4AF37',
        icon: <Sparkles size={18} />,
    },
    {
        id: 'light-forest',
        label: 'Forest Green',
        description: 'Fresh emerald light',
        bg: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
        accent: '#059669',
        icon: <Leaf size={18} />,
    },
    {
        id: 'light-rose',
        label: 'Rose White',
        description: 'Soft rose clarity',
        bg: 'linear-gradient(135deg, #FFFFFF, #FFF1F2)',
        accent: '#E11D48',
        icon: <Sun size={18} />,
    },
];

const TeacherSettings = ({ user }) => {
    const themeKey = `theme_teacher_${user?.id || 'default'}`;
    const [theme, setTheme] = useState(localStorage.getItem(themeKey) || 'dark');
    const [editProfileOpen, setEditProfileOpen] = useState(false);

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem(themeKey, newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <div className="glass-panel animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <Settings size={24} className="icon-primary" />
                Settings
            </h2>

            {/* ── Appearance ── */}
            <section style={{ marginBottom: '2.5rem' }}>
                <h4 style={{
                    marginBottom: '1.25rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700'
                }}>
                    <Palette size={15} />
                    Appearance
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '1rem' }}>
                    {themes.map(t => {
                        const active = theme === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => handleThemeChange(t.id)}
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: `2px solid ${active ? t.accent : 'var(--border-subtle)'}`,
                                    borderRadius: '14px',
                                    padding: '1rem',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.22s',
                                    position: 'relative',
                                    boxShadow: active ? `0 0 0 3px ${t.accent}22` : 'none',
                                    outline: 'none',
                                }}
                            >
                                {/* Mini preview strip */}
                                <div style={{
                                    height: '48px', borderRadius: '8px',
                                    background: t.bg, marginBottom: '0.75rem',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <span style={{ color: t.accent, display: 'flex' }}>{t.icon}</span>
                                </div>

                                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                                    {t.label}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {t.description}
                                </div>

                                {active && (
                                    <CheckCircle2
                                        size={18}
                                        style={{
                                            position: 'absolute', top: '0.6rem', right: '0.6rem',
                                            color: t.accent
                                        }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Dark / Light quick toggle */}
                <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Quick toggle:</span>
                    <button
                        onClick={() => handleThemeChange(theme.startsWith('light') ? 'dark' : 'light-modern')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.5rem 1.1rem',
                            background: 'var(--surface-hover)',
                            border: '1px solid var(--border-strong)',
                            borderRadius: '30px', cursor: 'pointer',
                            color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.85rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {theme.startsWith('light') ? <Moon size={15} /> : <Sun size={15} />}
                        Switch to {theme.startsWith('light') ? 'Dark' : 'Light'} Mode
                    </button>
                </div>
            </section>

            {/* ── Profile ── */}
            <section>
                <h4 style={{
                    marginBottom: '1.25rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700'
                }}>
                    <User size={15} />
                    Profile
                </h4>

                {/* Profile card (read-only display) */}
                <div style={{
                    background: 'var(--surface-hover)', borderRadius: '14px',
                    border: '1px solid var(--border-subtle)', padding: '1.5rem',
                    marginBottom: '1.25rem', display: 'grid', gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '50%',
                            background: 'var(--secondary)', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '800', fontSize: '1.4rem', color: '#fff'
                        }}>
                            {user?.name?.[0]?.toUpperCase() || 'T'}
                        </div>
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                                Prof. {user?.name || '—'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {user?.email || '—'}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Role</div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Faculty / Teacher</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Status</div>
                            <div style={{ fontWeight: '600', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                                Verified
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Profile button — UI only, no action */}
                {!editProfileOpen ? (
                    <button
                        className="btn btn-outline"
                        onClick={() => setEditProfileOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
                    >
                        <User size={17} />
                        Edit Profile
                    </button>
                ) : (
                    <div style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
                        borderRadius: '14px', padding: '1.5rem'
                    }}>
                        <h4 style={{ marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Edit Profile</h4>
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Full Name</label>
                                <input type="text" className="glass-input" defaultValue={user?.name} disabled placeholder="Name" />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Email Address</label>
                                <input type="email" className="glass-input" defaultValue={user?.email} disabled placeholder="Email" />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">New Password</label>
                                <input type="password" className="glass-input" disabled placeholder="••••••••" />
                            </div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                            ⚙️ Profile editing will be available in a future update.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                            <button className="btn btn-primary" disabled style={{ opacity: 0.5 }}>Save Changes</button>
                            <button className="btn btn-outline" onClick={() => setEditProfileOpen(false)}>Cancel</button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default TeacherSettings;
