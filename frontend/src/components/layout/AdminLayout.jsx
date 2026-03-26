import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
    '/admin': 'Dashboard',
    '/admin/departments': 'Departments',
    '/admin/faculty': 'Faculty',
    '/admin/subjects': 'Subjects',
    '/admin/sections': 'Sections',
    '/admin/rooms': 'Rooms & Labs',
    '/admin/time-slots': 'Time Slots',
    '/admin/workload': 'Workload & Availability',
    '/admin/generate': 'Generate Timetable',
    '/admin/timetable': 'View Timetable',
    '/admin/edit-timetable': 'Edit Schedule',
    '/admin/analytics': 'Analytics',
    '/admin/profile': 'Profile',
};

export default function AdminLayout() {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    // Re-enabled auth guard
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const title = pageTitles[location.pathname] || 'Admin Portal';

    return (
        <div className="admin-layout">
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
            <div className={`admin-layout__main${collapsed ? ' admin-layout__main--collapsed' : ''}`}>
                <Header title={title} collapsed={collapsed} />
                <main className="admin-layout__content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
