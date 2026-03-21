import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useSchedule } from '../context/ScheduleContext';
import { syncCourses } from '../services/api';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineBookOpen } from 'react-icons/hi2';

export default function Subjects() {
    const notify = useNotification();
    const { markSynced, refreshStatus, departments, subjects, setSubjects } = useSchedule();
    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [modal, setModal] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [form, setForm] = useState({ name: '', departmentId: '', weeklyHours: '', labRequired: false });
    const [errors, setErrors] = useState({});
    const [syncing, setSyncing] = useState(false);

    const filtered = subjects.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
        const matchDept = !filterDept || s.departmentId === Number(filterDept);
        return matchSearch && matchDept;
    });

    const openAdd = () => { setForm({ name: '', departmentId: '', weeklyHours: '4', labRequired: false }); setErrors({}); setModal({ mode: 'add' }); };
    const openEdit = (s) => { setForm({ name: s.name, departmentId: String(s.departmentId), weeklyHours: String(s.weeklyHours), labRequired: s.labRequired }); setErrors({}); setModal({ mode: 'edit', data: s }); };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Required';
        if (!form.departmentId) errs.departmentId = 'Required';
        if (!form.weeklyHours || Number(form.weeklyHours) < 1) errs.weeklyHours = 'Valid hours required';
        setErrors(errs); return Object.keys(errs).length === 0;
    };

    // Sync subjects to backend as courses
    const syncToBackend = async (updatedSubjects) => {
        setSyncing(true);
        try {
            await syncCourses(updatedSubjects);
            markSynced('courses');
            refreshStatus();
            notify.success('Synced with backend', `${updatedSubjects.length} course(s) synced.`);
        } catch (err) {
            notify.error('Sync failed', err.message);
        } finally {
            setSyncing(false);
        }
    };

    const handleSave = () => {
        if (!validate()) return;
        const dept = departments.find(d => d.id === Number(form.departmentId));
        const data = { name: form.name, departmentId: Number(form.departmentId), department: dept?.name || '', weeklyHours: Number(form.weeklyHours), labRequired: form.labRequired };
        let updated;
        if (modal.mode === 'add') {
            updated = [...subjects, { id: Date.now(), ...data }];
            setSubjects(updated);
            notify.success('Subject added', `${form.name} created.`);
        } else {
            updated = subjects.map(s => s.id === modal.data.id ? { ...s, ...data } : s);
            setSubjects(updated);
            notify.success('Subject updated', `${form.name} updated.`);
        }
        setModal(null);
        syncToBackend(updated);
    };

    const handleDelete = () => {
        const updated = subjects.filter(s => s.id !== deleteConfirm.id);
        setSubjects(updated);
        notify.success('Subject deleted', `${deleteConfirm.name} removed.`);
        setDeleteConfirm(null);
        syncToBackend(updated);
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header__info">
                    <h2>Subjects</h2>
                    <p className="page-header__description">Manage course subjects and lab requirements</p>
                </div>
                <div className="page-header__actions" style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    {syncing && <span style={{ fontSize: 'var(--font-xs)', color: 'var(--primary-500)' }}>⟳ Syncing...</span>}
                    <button className="btn btn--primary" onClick={openAdd}><HiOutlinePlus /> Add Subject</button>
                </div>
            </div>

            <div className="card">
                <div className="card__header" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                    <div className="search-bar">
                        <HiOutlineMagnifyingGlass className="search-bar__icon" />
                        <input className="search-bar__input" placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="filter-bar__select" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div className="card__body" style={{ padding: 0 }}>
                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state__icon"><HiOutlineBookOpen /></div>
                            <div className="empty-state__title">No subjects found</div>
                            <div className="empty-state__description">{search || filterDept ? 'Try different filters.' : 'Add your first subject.'}</div>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="table">
                                <thead><tr><th>Subject Name</th><th>Department</th><th>Weekly Hours</th><th>Lab Required</th><th style={{ width: 120 }}>Actions</th></tr></thead>
                                <tbody>
                                    {filtered.map(s => (
                                        <tr key={s.id}>
                                            <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{s.name}</td>
                                            <td><span className="badge badge--neutral">{s.department}</span></td>
                                            <td>{s.weeklyHours}h</td>
                                            <td>{s.labRequired ? <span className="badge badge--warning">Yes</span> : <span className="badge badge--neutral">No</span>}</td>
                                            <td><div className="table__actions">
                                                <button className="btn btn--ghost btn--icon btn--sm" onClick={() => openEdit(s)}><HiOutlinePencil /></button>
                                                <button className="btn btn--ghost btn--icon btn--sm" style={{ color: 'var(--error-500)' }} onClick={() => setDeleteConfirm(s)}><HiOutlineTrash /></button>
                                            </div></td>
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
                            <h3 className="modal__title">{modal.mode === 'add' ? 'Add Subject' : 'Edit Subject'}</h3>
                            <button className="modal__close" onClick={() => setModal(null)}><HiOutlineXMark /></button>
                        </div>
                        <div className="modal__body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                <div className="form-field">
                                    <label className="form-field__label form-field__label--required">Subject Name</label>
                                    <input className={`form-field__input${errors.name ? ' form-field__input--error' : ''}`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                    {errors.name && <span className="form-field__error">{errors.name}</span>}
                                </div>
                                <div className="form-grid">
                                    <div className="form-field">
                                        <label className="form-field__label form-field__label--required">Department</label>
                                        <select className={`form-field__input${errors.departmentId ? ' form-field__input--error' : ''}`} value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
                                            <option value="">Select</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                        {errors.departmentId && <span className="form-field__error">{errors.departmentId}</span>}
                                    </div>
                                    <div className="form-field">
                                        <label className="form-field__label form-field__label--required">Weekly Hours</label>
                                        <input className={`form-field__input${errors.weeklyHours ? ' form-field__input--error' : ''}`} type="number" min="1" value={form.weeklyHours} onChange={e => setForm({ ...form, weeklyHours: e.target.value })} />
                                        {errors.weeklyHours && <span className="form-field__error">{errors.weeklyHours}</span>}
                                    </div>
                                </div>
                                <div className="toggle-field">
                                    <div className={`toggle${form.labRequired ? ' toggle--active' : ''}`} onClick={() => setForm({ ...form, labRequired: !form.labRequired })}>
                                        <div className="toggle__knob"></div>
                                    </div>
                                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--gray-700)' }}>Lab Required</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--secondary" onClick={() => setModal(null)}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleSave}>{modal.mode === 'add' ? 'Add Subject' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal__header">
                            <h3 className="modal__title">Delete Subject</h3>
                            <button className="modal__close" onClick={() => setDeleteConfirm(null)}><HiOutlineXMark /></button>
                        </div>
                        <div className="modal__body"><p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-sm)' }}>Delete <strong>{deleteConfirm.name}</strong>?</p></div>
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
