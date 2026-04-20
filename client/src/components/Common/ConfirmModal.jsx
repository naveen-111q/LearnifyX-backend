import React from 'react';

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel, confirmText = 'Confirm Delete', isDanger = true }) => {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', 
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
        }}>
            <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Confirm Action</h3>
                <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>{message}</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
                    <button 
                        className={`btn ${isDanger ? 'btn-primary' : 'btn-primary'}`} 
                        style={{ 
                            background: isDanger ? 'var(--error)' : 'var(--primary)', 
                            borderColor: isDanger ? 'var(--error)' : 'var(--primary)', 
                            color: 'white' 
                        }} 
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
