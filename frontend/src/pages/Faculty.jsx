import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useSchedule } from '../context/ScheduleContext';
import { syncFaculty } from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import { HiOutlinePlus, HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineUserGroup, HiPencil, HiTrash } from 'react-icons/hi2';

export default function Faculty() {
    const notify = useNotification();
    const { markSynced, refreshStatus, departments, faculty, setFaculty, userId } = useSchedule();
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', departmentId: '', maxHours: '', role: 'Professor' });
    const [errors, setErrors] = useState({});
    const [syncing, setSyncing] = useState(false);

    const filtered = faculty.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.email.toLowerCase().includes(search.toLowerCase()) ||
        (f.department || '').toLowerCase().includes(search.toLowerCase())
    );

    const openAdd = () => {
        setForm({ name: '', email: '', departmentId: '', maxHours: '18', role: 'Professor' });
        setErrors({});
        setModal({ mode: 'add' });
    };

    const openEdit = (f) => {
        setForm({ name: f.name, email: f.email, departmentId: String(f.departmentId), maxHours: String(f.maxHours), role: f.role || 'Professor' });
        setErrors({});
        setModal({ mode: 'edit', data: f });
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Name is required';
        if (!form.email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
        if (!form.departmentId) errs.departmentId = 'Select a department';
        if (!form.maxHours || isNaN(form.maxHours) || Number(form.maxHours) < 1) errs.maxHours = 'Valid hours required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const syncToBackend = async (updatedFaculty) => {
        setSyncing(true);
        try {
            await syncFaculty(updatedFaculty, userId);
            markSynced('faculty');
            refreshStatus();
            notify.success('Synced with backend', `${updatedFaculty.length} faculty member(s) synced.`);
        } catch (err) {
            notify.error('Sync failed', err.message);
        } finally {
            setSyncing(false);
        }
    };

    const handleSave = () => {
        if (!validate()) return;
        const dept = departments.find(d => d.id === Number(form.departmentId));
        let updated;
        if (modal.mode === 'add') {
            updated = [...faculty, {
                id: uuidv4(), name: form.name, email: form.email,
                departmentId: Number(form.departmentId), department: dept?.name || '',
                maxHours: Number(form.maxHours), role: form.role,
            }];
            setFaculty(updated);
            notify.success('Faculty added', `${form.name} has been added.`);
        } else {
            updated = faculty.map(f => f.id === modal.data.id ? {
                ...f, name: form.name, email: form.email,
                departmentId: Number(form.departmentId), department: dept?.name || '',
                maxHours: Number(form.maxHours), role: form.role,
            } : f);
            setFaculty(updated);
            notify.success('Faculty updated', `${form.name} has been updated.`);
        }
        setModal(null);
        syncToBackend(updated);
    };

    const handleDelete = () => {
        const updated = faculty.filter(f => f.id !== deleteConfirm.id);
        setFaculty(updated);
        notify.success('Faculty deleted', `${deleteConfirm.name} has been removed.`);
        setDeleteConfirm(null);
        syncToBackend(updated);
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header__info">
                    <h2>Faculty</h2>
                    <p className="page-header__description">Manage faculty members and their allocations</p>
                </div>
                <div className="page-header__actions" style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    {syncing && <span style={{ fontSize: 'var(--font-xs)', color: 'var(--primary-500)' }}>⟳ Syncing...</span>}
                    <button className="btn btn--primary" onClick={openAdd}><HiOutlinePlus /> Add Faculty</button>
                </div>
            </div>

            <div className="card">
                <div className="card__header">
                    <div className="search-bar">
                        <HiOutlineMagnifyingGlass className="search-bar__icon" />
                        <input className="search-bar__input" placeholder="Search faculty..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--gray-500)' }}>{filtered.length} members</span>
                </div>
                <div className="card__body" style={{ padding: 0 }}>
                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state__icon"><HiOutlineUserGroup /></div>
                            <div className="empty-state__title">No faculty found</div>
                            <div className="empty-state__description">{search ? 'Try a different search.' : 'Add your first faculty member.'}</div>
                            {!search && <button className="btn btn--primary btn--sm" onClick={openAdd}><HiOutlinePlus /> Add Faculty</button>}
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="table">
                                <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Max Hours</th><th style={{ width: 120 }}>Actions</th></tr></thead>
                                <tbody>
                                    {filtered.map(f => (
                                        <tr key={f.id}>
                                            <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{f.name}</td>
                                            <td>{f.email}</td>
                                            <td><span className="badge badge--neutral">{f.department}</span></td>
                                            <td><span className={`badge ${f.role === 'Lab Assistant' ? 'badge--warning' : 'badge--primary'}`}>{f.role || 'Professor'}</span></td>
                                            <td>{f.maxHours}h/week</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                    <button 
                                                        onClick={() => openEdit(f)}
                                                        title="Edit"
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', display: 'block', visibility: 'visible', opacity: 1 }}
                                                    >
                                                        <HiPencil style={{ color: '#000000', fontSize: '1.5rem', display: 'block', visibility: 'visible', opacity: 1 }} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setDeleteConfirm(f)}
                                                        title="Delete"
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', display: 'block', visibility: 'visible', opacity: 1 }}
                                                    >
                                                        <HiTrash style={{ color: '#ff0000', fontSize: '1.5rem', display: 'block', visibility: 'visible', opacity: 1 }} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {modal && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h3 className="modal__title">{modal.mode === 'add' ? 'Add Faculty' : 'Edit Faculty'}</h3>
                            <button className="modal__close" onClick={() => setModal(null)}><HiOutlineXMark /></button>
                        </div>
                        <div className="modal__body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                <div className="form-field">
                                    <label className="form-field__label form-field__label--required">Full Name</label>
                                    <input className={`form-field__input${errors.name ? ' form-field__input--error' : ''}`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Dr. John Doe" />
                                    {errors.name && <span className="form-field__error">{errors.name}</span>}
                                </div>
                                <div className="form-field">
                                    <label className="form-field__label form-field__label--required">Email</label>
                                    <input className={`form-field__input${errors.email ? ' form-field__input--error' : ''}`} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@university.edu" />
                                    {errors.email && <span className="form-field__error">{errors.email}</span>}
                                </div>
                                <div className="form-grid">
                                    <div className="form-field">
                                        <label className="form-field__label form-field__label--required">Department</label>
                                        <select className={`form-field__input${errors.departmentId ? ' form-field__input--error' : ''}`} value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
                                            <option value="">Select department</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                        {errors.departmentId && <span className="form-field__error">{errors.departmentId}</span>}
                                    </div>
                                </div>
                                <div className="form-field">
                                    <label className="form-field__label form-field__label--required">Role</label>
                                    <select className="form-field__input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                        <option value="Professor">Professor</option>
                                        <option value="Lab Assistant">Lab Assistant</option>
                                    </select>
                                </div>
                                <div className="form-grid">
                                    <div className="form-field">
                                        <label className="form-field__label form-field__label--required">Max Weekly Hours</label>
                                        <input className={`form-field__input${errors.maxHours ? ' form-field__input--error' : ''}`} type="number" min="1" max="40" value={form.maxHours} onChange={e => setForm({ ...form, maxHours: e.target.value })} />
                                        {errors.maxHours && <span className="form-field__error">{errors.maxHours}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--secondary" onClick={() => setModal(null)}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleSave}>{modal.mode === 'add' ? 'Add Faculty' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal__header">
                            <h3 className="modal__title">Delete Faculty</h3>
                            <button className="modal__close" onClick={() => setDeleteConfirm(null)}><HiOutlineXMark /></button>
                        </div>
                        <div className="modal__body">
                            <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-sm)' }}>
                                Are you sure you want to remove <strong>{deleteConfirm.name}</strong>?
                            </p>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn btn--danger" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
