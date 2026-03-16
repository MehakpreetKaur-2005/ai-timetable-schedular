import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { HiOutlineArrowRightOnRectangle, HiOutlinePencil, HiOutlineUser, HiOutlineEnvelope, HiOutlineShieldCheck } from 'react-icons/hi2';

export default function Profile() {
    const { user, logout } = useAuth();
    const notify = useNotification();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleSave = () => {
        notify.success('Profile updated', 'Your name has been updated.');
        setEditing(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header__info"><h2>Profile</h2><p className="page-header__description">Manage your admin account</p></div>
            </div>

            <div style={{ maxWidth: 600 }}>
                <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <div className="card__header">
                        <h3 className="card__title">Account Information</h3>
                        {!editing && (
                            <button className="btn btn--secondary btn--sm" onClick={() => setEditing(true)}>
                                <HiOutlinePencil /> Edit
                            </button>
                        )}
                    </div>
                    <div className="card__body">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                            <div style={{
                                width: 72, height: 72, borderRadius: 'var(--radius-full)',
                                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 'var(--font-2xl)', fontWeight: 700,
                            }}>
                                {user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
                            </div>
                            <div>
                                <h3 style={{ marginBottom: 'var(--space-1)' }}>{user?.name}</h3>
                                <span className="badge badge--primary"><HiOutlineShieldCheck /> Admin</span>
                            </div>
                        </div>

                        {editing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                <div className="form-field">
                                    <label className="form-field__label">Full Name</label>
                                    <input className="form-field__input" value={name} onChange={e => setName(e.target.value)} />
                                </div>
                                <div className="form-field">
                                    <label className="form-field__label">Email</label>
                                    <input className="form-field__input" value={user?.email} disabled style={{ opacity: 0.6 }} />
                                    <span className="form-field__hint">Email cannot be changed</span>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                    <button className="btn btn--primary" onClick={handleSave}>Save</button>
                                    <button className="btn btn--secondary" onClick={() => setEditing(false)}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--gray-100)' }}>
                                    <HiOutlineUser style={{ color: 'var(--gray-400)' }} />
                                    <div><div style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-400)' }}>Full Name</div><div style={{ fontWeight: 500 }}>{user?.name}</div></div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) 0' }}>
                                    <HiOutlineEnvelope style={{ color: 'var(--gray-400)' }} />
                                    <div><div style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-400)' }}>Email</div><div style={{ fontWeight: 500 }}>{user?.email}</div></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card__body">
                        <button className="btn btn--danger btn--full" onClick={() => setShowLogoutConfirm(true)}>
                            <HiOutlineArrowRightOnRectangle /> Logout
                        </button>
                    </div>
                </div>
            </div>

            {showLogoutConfirm && (
                <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
                        <div className="modal__header"><h3 className="modal__title">Confirm Logout</h3></div>
                        <div className="modal__body">
                            <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-sm)' }}>Are you sure you want to logout?</p>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--secondary" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                            <button className="btn btn--danger" onClick={handleLogout}>Logout</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
