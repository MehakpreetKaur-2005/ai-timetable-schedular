import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineCpuChip } from 'react-icons/hi2';

export default function AuthLayout() {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/admin" replace />;
    }

    return (
        <div className="auth-layout">
            <Outlet />
        </div>
    );
}
