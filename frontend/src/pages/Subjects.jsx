import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useSchedule } from '../context/ScheduleContext';
import { syncCourses } from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import { HiOutlinePlus, HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineBookOpen, HiPencil, HiTrash } from 'react-icons/hi2';

export default function Subjects() {
    const notify = useNotification();
    const { markSynced, refreshStatus, departments, subjects, setSubjects, faculty, userId } = useSchedule();
    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [modal, setModal] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [form, setForm] = useState({ name: '', subjectCode: '', departmentId: '', theoryHours: '', labHours: '', labRequired: false, labAssistantId: '' });
    const [errors, setErrors] = useState({});
    const [syncing, setSyncing] = useState(false);

    const filtered = subjects.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
        const matchDept = !filterDept || s.departmentId === Number(filterDept);
        return matchSearch && matchDept;
    });

    const openAdd = () => { setForm({ name: '', subjectCode: '', departmentId: '', theoryHours: '3', labHours: '2', labRequired: false, labAssistantId: '' }); setErrors({}); setModal({ mode: 'add' }); };
    const openEdit = (s) => { 
        setForm({ 
            name: s.name, 
            subjectCode: s.subjectCode || '', 
            departmentId: String(s.departmentId), 
            theoryHours: String(s.theoryHours ?? s.weeklyHours), 
            labHours: String(s.labHours || 0), 
            labRequired: s.labRequired,
            labAssistantId: s.labAssistantId || ''
        }); 
        setErrors({}); 
        setModal({ mode: 'edit', data: s }); 
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Required';
        if (!form.subjectCode.trim()) errs.subjectCode = 'Required';
        if (!form.departmentId) errs.departmentId = 'Required';
        if (!form.theoryHours && form.theoryHours !== '0' && form.theoryHours !== 0) errs.theoryHours = 'Required';
        if (form.theoryHours !== '' && Number(form.theoryHours) < 0) errs.theoryHours = 'Cannot be negative';
        if (form.labRequired && (!form.labHours || Number(form.labHours) < 1)) errs.labHours = 'Required';
        if (form.labRequired && !form.labAssistantId) errs.labAssistantId = 'Select a lab assistant';
        setErrors(errs); return Object.keys(errs).length === 0;
    };

    // Sync subjects to backend as courses
    const syncToBackend = async (updatedSubjects) => {
        setSyncing(true);
        try {
            await syncCourses(updatedSubjects, userId);
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
        const tHrs = Number(form.theoryHours) || 0;
        const lHrs = form.labRequired ? (Number(form.labHours) || 0) : 0;
        const labAssistants = faculty.filter(f => f.role === 'Lab Assistant');
        const data = { 
            name: form.name, 
            subjectCode: form.subjectCode.toUpperCase(), 
            departmentId: Number(form.departmentId), 
            department: dept?.name || '', 
            theoryHours: tHrs,
            labHours: lHrs,
            weeklyHours: tHrs + lHrs, 
            labRequired: form.labRequired,
            labAssistantId: form.labRequired ? form.labAssistantId : '',
            labAssistantName: form.labRequired ? (labAssistants.find(la => la.id === form.labAssistantId)?.name || '') : ''
        };
        let updated;
        if (modal.mode === 'add') {
            updated = [...subjects, { id: uuidv4(), ...data }];
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
                                <thead><tr><th>Subject</th><th>Department</th><th>Weekly Hours</th><th>Lab Required</th><th style={{ width: 120 }}>Actions</th></tr></thead>
                                <tbody>
                                    {filtered.map(s => (
                                        <tr key={s.id}>
                                            <td style={{ color: 'var(--gray-900)' }}>
                                                <div style={{ fontWeight: 600 }}>{s.name}</div>
                                                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-500)' }}>{s.subjectCode}</div>
                                            </td>
                                            <td><span className="badge badge--neutral">{s.department}</span></td>
                                            <td>
                                                {Number(s.theoryHours || s.weeklyHours) > 0 && <div style={{ fontWeight: 500 }}>{s.theoryHours || s.weeklyHours}h Theory</div>}
                                                {s.labRequired && <div style={{ fontSize: 'var(--font-xs)', color: 'var(--warning-600)' }}>+ {s.labHours}h Lab</div>}
                                                {s.labRequired && s.labAssistantName && <div style={{ fontSize: 'var(--font-xs)', color: 'var(--primary-600)' }}>🧪 {s.labAssistantName}</div>}
                                            </td>
                                            <td>{s.labRequired ? <span className="badge badge--warning">Yes</span> : <span className="badge badge--neutral">No</span>}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                    <button 
                                                        onClick={() => openEdit(s)}
                                                        title="Edit"
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', display: 'block', visibility: 'visible', opacity: 1 }}
                                                    >
                                                        <HiPencil style={{ color: '#000000', fontSize: '1.5rem', display: 'block', visibility: 'visible', opacity: 1 }} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setDeleteConfirm(s)}
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
                            <h3 className="modal__title">{modal.mode === 'add' ? 'Add Subject' : 'Edit Subject'}</h3>
                            <button className="modal__close" onClick={() => setModal(null)}><HiOutlineXMark /></button>
                        </div>
                        <div className="modal__body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                <div className="form-grid">
                                    <div className="form-field">
                                        <label className="form-field__label form-field__label--required">Subject Name</label>
                                        <input className={`form-field__input${errors.name ? ' form-field__input--error' : ''}`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                        {errors.name && <span className="form-field__error">{errors.name}</span>}
                                    </div>
                                    <div className="form-field">
                                        <label className="form-field__label form-field__label--required">Subject Code</label>
                                        <input className={`form-field__input${errors.subjectCode ? ' form-field__input--error' : ''}`} value={form.subjectCode} onChange={e => setForm({ ...form, subjectCode: e.target.value })} placeholder="e.g. CS101" />
                                        {errors.subjectCode && <span className="form-field__error">{errors.subjectCode}</span>}
                                    </div>
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
                                        <label className="form-field__label form-field__label--required">Theory Hours</label>
                                        <input 
                                            className={`form-field__input${errors.theoryHours ? ' form-field__input--error' : ''}`} 
                                            type="number" min="0" 

                                            style={{ maxWidth: '100px', width: '100%' }}
                                            value={form.theoryHours} 
                                            onChange={e => setForm({ ...form, theoryHours: e.target.value })} 
                                        />
                                        {errors.theoryHours && <span className="form-field__error">{errors.theoryHours}</span>}
                                    </div>
                                </div>
                                {form.labRequired && (
                                    <div className="form-field">
                                        <label className="form-field__label form-field__label--required">Lab Hours</label>
                                        <input 
                                            className={`form-field__input${errors.labHours ? ' form-field__input--error' : ''}`} 
                                            type="number" min="1" 
                                            style={{ maxWidth: '100px', width: '100%' }}
                                            value={form.labHours} 
                                            onChange={e => setForm({ ...form, labHours: e.target.value })} 
                                        />
                                        {errors.labHours && <span className="form-field__error">{errors.labHours}</span>}
                                    </div>
                                )}
                                {form.labRequired && (
                                    <div className="form-field">
                                        <label className="form-field__label form-field__label--required">Lab Assistant</label>
                                        <select 
                                            className={`form-field__input${errors.labAssistantId ? ' form-field__input--error' : ''}`} 
                                            value={form.labAssistantId} 
                                            onChange={e => setForm({ ...form, labAssistantId: e.target.value })}
                                        >
                                            <option value="">Select Lab Assistant</option>
                                            {faculty.filter(f => f.role === 'Lab Assistant').map(f => (
                                                <option key={f.id} value={f.id}>{f.name} — {f.department}</option>
                                            ))}
                                        </select>
                                        {errors.labAssistantId && <span className="form-field__error">{errors.labAssistantId}</span>}
                                    </div>
                                )}
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
