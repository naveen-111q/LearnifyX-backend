import React from 'react';

const TeacherProfile = ({ user }) => {
    return (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    width: '48px', height: '48px', borderRadius: '50%', 
                    background: 'var(--primary)', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' 
                }}>
                    {user?.name?.charAt(0).toUpperCase()}
                </span>
                Teacher Profile
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Name</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: '500' }}>Prof. {user?.name}</p>
                </div>
                
                {user?.email && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email Address</p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: '500' }}>{user.email}</p>
                    </div>
                )}
                
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Role</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: '500', textTransform: 'capitalize' }}>
                        {user?.role} Administrator
                    </p>
                </div>
            </div>
            
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Profile editing features will be available in a future update.
                </p>
            </div>
        </div>
    );
};

export default TeacherProfile;
