import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // Bypassing authentication as requested.
    // The user is always considered logged in with a mock session.
    const user = { name: 'Admin User', email: 'admin@example.com', role: 'admin' };

    const login = async () => true;
    const signup = async () => true;
    const logout = () => {};

    return (
        <AuthContext.Provider value={{ user, loading: false, login, signup, logout, isAuthenticated: true }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
