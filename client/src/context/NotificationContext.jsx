/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const addNotification = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, [removeNotification]);

    const showSuccess = useCallback((msg) => addNotification(msg, 'success'), [addNotification]);
    const showError = useCallback((msg) => addNotification(msg, 'error'), [addNotification]);
    const showInfo = useCallback((msg) => addNotification(msg, 'info'), [addNotification]);

    return (
        <NotificationContext.Provider value={{ notifications, showSuccess, showError, showInfo, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
