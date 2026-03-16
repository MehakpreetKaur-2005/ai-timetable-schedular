import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { mockDepartments as initialData } from '../data/mockData';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineBuildingOffice2 } from 'react-icons/hi2';

export default function Departments() {
    const notify = useNotification();
    const [departments, setDepartments] = useState(initialData);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', data }
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [form, setForm] = useState({ name: '', code: '' });
    const [errors, setErrors] = useState({});

    const filtered = departments.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase())
    );

    const openAdd = () => {
        setForm({ name: '', code: '' });
        setErrors({});
        setModal({ mode: 'add' });
    };

    const openEdit = (dept) => {
        setForm({ name: dept.name, code: dept.code });
        setErrors({});
        setModal({ mode: 'edit', data: dept });
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Name is required';
        if (!form.code.trim()) errs.code = 'Code is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        if (modal.mode === 'add') {
            const newDept = { id: Date.now(), name: form.name, code: form.code.toUpperCase() };
            setDepartments([...departments, newDept]);
            notify.success('Department added', `${form.name} has been created.`);
        } else {
            setDepartments(departments.map(d => d.id === modal.data.id ? { ...d, ...form, code: form.code.toUpperCase() } : d));
            notify.success('Department updated', `${form.name} has been updated.`);
        }
        setModal(null);
    };

    const handleDelete = () => {
        setDepartments(departments.filter(d => d.id !== deleteConfirm.id));
        notify.success('Department deleted', `${deleteConfirm.name} has been removed.`);
        setDeleteConfirm(null);
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header__info">
                    <h2>Departments</h2>
                    <p className="page-header__description">Manage academic departments</p>
                </div>
                <div className="page-header__actions">
                    <button className="btn btn--primary" onClick={openAdd}>
                        <HiOutlinePlus /> Add Department
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="card__header">
                    <div className="search-bar">
                        <HiOutlineMagnifyingGlass className="search-bar__icon" />
                        <input className="search-bar__input" placeholder="Search departments..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--gray-500)' }}>{filtered.length} departments</span>
                </div>
                <div className="card__body" style={{ padding: 0 }}>
                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state__icon"><HiOutlineBuildingOffice2 /></div>
                            <div className="empty-state__title">No departments found</div>
                            <div className="empty-state__description">
                                {search ? 'Try a different search term.' : 'Add your first department to get started.'}
                            </div>
                            {!search && <button className="btn btn--primary btn--sm" onClick={openAdd}><HiOutlinePlus /> Add Department</button>}
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Code</th>
                                        <th style={{ width: 120 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(dept => (
                                        <tr key={dept.id}>
                                            <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{dept.name}</td>
                                            <td><span className="badge badge--primary">{dept.code}</span></td>
                                            <td>
                                                <div className="table__actions">
                                                    <button className="btn btn--ghost btn--icon btn--sm" onClick={() => openEdit(dept)} title="Edit">
                                                        <HiOutlinePencil />
                                                    </button>
                                                    <button className="btn btn--ghost btn--icon btn--sm" onClick={() => setDeleteConfirm(dept)} title="Delete" style={{ color: 'var(--error-500)' }}>
                                                        <HiOutlineTrash />
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

            {/* Add/Edit Modal */}
            {modal && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h3 className="modal__title">{modal.mode === 'add' ? 'Add Department' : 'Edit Department'}</h3>
                            <button className="modal__close" onClick={() => setModal(null)}><HiOutlineXMark /></button>
                        </div>
                        <div className="modal__body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                <div className="form-field">
                                    <label className="form-field__label form-field__label--required">Department Name</label>
                                    <input className={`form-field__input${errors.name ? ' form-field__input--error' : ''}`} placeholder="e.g. Computer Science" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                    {errors.name && <span className="form-field__error">{errors.name}</span>}
                                </div>
                                <div className="form-field">
                                    <label className="form-field__label form-field__label--required">Code</label>
                                    <input className={`form-field__input${errors.code ? ' form-field__input--error' : ''}`} placeholder="e.g. CS" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                                    {errors.code && <span className="form-field__error">{errors.code}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--secondary" onClick={() => setModal(null)}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleSave}>
                                {modal.mode === 'add' ? 'Add Department' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal__header">
                            <h3 className="modal__title">Delete Department</h3>
                            <button className="modal__close" onClick={() => setDeleteConfirm(null)}><HiOutlineXMark /></button>
                        </div>
                        <div className="modal__body">
                            <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-sm)' }}>
                                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
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
