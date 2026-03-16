import { createContext, useContext, useState, useCallback } from 'react';
import { HiCheckCircle, HiXCircle, HiExclamationTriangle, HiInformationCircle, HiXMark } from 'react-icons/hi2';

const NotificationContext = createContext(null);

let toastId = 0;

export function NotificationProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((type, title, message = '') => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const notify = {
        success: (title, message) => addToast('success', title, message),
        error: (title, message) => addToast('error', title, message),
        warning: (title, message) => addToast('warning', title, message),
        info: (title, message) => addToast('info', title, message),
    };

    const icons = {
        success: <HiCheckCircle />,
        error: <HiXCircle />,
        warning: <HiExclamationTriangle />,
        info: <HiInformationCircle />,
    };

    return (
        <NotificationContext.Provider value={notify}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast--${toast.type}`}>
                        <span className="toast__icon">{icons[toast.type]}</span>
                        <div className="toast__content">
                            <div className="toast__title">{toast.title}</div>
                            {toast.message && <div className="toast__message">{toast.message}</div>}
                        </div>
                        <button className="toast__close" onClick={() => removeToast(toast.id)}>
                            <HiXMark />
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
    return ctx;
}
