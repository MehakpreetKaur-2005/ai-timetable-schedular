import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    HiOutlineBell, HiOutlineUser, HiOutlineArrowRightOnRectangle,
    HiOutlineCog6Tooth
} from 'react-icons/hi2';

export default function Header({ title, collapsed }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : 'AD';

    return (
        <header className={`header${collapsed ? ' header--collapsed' : ''}`}>
            <h1 className="header__title">{title}</h1>

            <div className="header__actions">
                <button className="header__icon-btn" title="Notifications">
                    <HiOutlineBell />
                    <span className="badge"></span>
                </button>

                <div className="header__user-menu">
                    <div
                        className="header__avatar"
                        onClick={() => setShowDropdown(!showDropdown)}
                        title={user?.name}
                    >
                        {initials}
                    </div>

                    {showDropdown && (
                        <>
                            <div
                                style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                                onClick={() => setShowDropdown(false)}
                            />
                            <div className="header__dropdown">
                                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-100)', marginBottom: '4px' }}>
                                    <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--gray-900)' }}>{user?.name}</div>
                                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-500)' }}>{user?.email}</div>
                                </div>
                                <Link to="/admin/profile" className="header__dropdown-item" onClick={() => setShowDropdown(false)}>
                                    <HiOutlineUser /> Profile
                                </Link>
                                <div className="header__dropdown-divider" />
                                <button className="header__dropdown-item header__dropdown-item--danger" onClick={handleLogout}>
                                    <HiOutlineArrowRightOnRectangle /> Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
