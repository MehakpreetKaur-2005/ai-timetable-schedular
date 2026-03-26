import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineCpuChip } from 'react-icons/hi2';

export default function AuthLayout() {
    const { isAuthenticated } = useAuth();

    // Removed automatic redirect to dashboard here to allow login/signup pages access

    return (
        <div className="auth-layout">
            <Outlet />
        </div>
    );
}
