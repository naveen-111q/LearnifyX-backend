import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const NotificationContainer = () => {
    const { notifications, removeNotification } = useNotification();

    if (notifications.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '2rem',
            right: '2rem',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            pointerEvents: 'none'
        }}>
            {notifications.map(n => (
                <div 
                    key={n.id}
                    className="animate-fade-in"
                    style={{
                        pointerEvents: 'auto',
                        minWidth: '300px',
                        maxWidth: '450px',
                        background: 'var(--surface)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: `1px solid ${n.type === 'success' ? 'var(--success)' : n.type === 'error' ? 'var(--error)' : 'var(--border-strong)'}`,
                        borderRadius: '12px',
                        padding: '1rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <div style={{ marginTop: '0.1rem' }}>
                        {n.type === 'success' && <CheckCircle color="var(--success)" size={20} />}
                        {n.type === 'error' && <AlertCircle color="var(--error)" size={20} />}
                        {n.type === 'info' && <Info color="var(--primary)" size={20} />}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                        <div style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: '600', 
                            color: 'var(--text-primary)',
                            marginBottom: '0.25rem',
                            textTransform: 'capitalize'
                        }}>
                            {n.type}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            {n.message}
                        </div>
                    </div>

                    <button 
                        onClick={() => removeNotification(n.id)}
                        style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: 'var(--text-secondary)', 
                            cursor: 'pointer',
                            padding: '0.2rem',
                            display: 'flex'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default NotificationContainer;
