import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { mockSections as initialData, mockDepartments } from '../data/mockData';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineRectangleGroup } from 'react-icons/hi2';

export default function Sections() {
    const notify = useNotification();
    const [sections, setSections] = useState(initialData);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [form, setForm] = useState({ name: '', departmentId: '', studentCount: '' });
    const [errors, setErrors] = useState({});

    const filtered = sections.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.department.toLowerCase().includes(search.toLowerCase())
    );

    const openAdd = () => { setForm({ name: '', departmentId: '', studentCount: '' }); setErrors({}); setModal({ mode: 'add' }); };
    const openEdit = (s) => { setForm({ name: s.name, departmentId: String(s.departmentId), studentCount: String(s.studentCount) }); setErrors({}); setModal({ mode: 'edit', data: s }); };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Required';
        if (!form.departmentId) errs.departmentId = 'Required';
        if (!form.studentCount || isNaN(form.studentCount) || Number(form.studentCount) < 1) errs.studentCount = 'Valid count required';
        setErrors(errs); return Object.keys(errs).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        const dept = mockDepartments.find(d => d.id === Number(form.departmentId));
        const data = { name: form.name, departmentId: Number(form.departmentId), department: dept?.name || '', studentCount: Number(form.studentCount) };
        if (modal.mode === 'add') {
            setSections([...sections, { id: Date.now(), ...data }]);
            notify.success('Section added', `${form.name} created.`);
        } else {
            setSections(sections.map(s => s.id === modal.data.id ? { ...s, ...data } : s));
            notify.success('Section updated', `${form.name} updated.`);
        }
        setModal(null);
    };

    const handleDelete = () => {
        setSections(sections.filter(s => s.id !== deleteConfirm.id));
        notify.success('Section deleted', `${deleteConfirm.name} removed.`);
        setDeleteConfirm(null);
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header__info"><h2>Sections</h2><p className="page-header__description">Manage class sections</p></div>
                <div className="page-header__actions"><button className="btn btn--primary" onClick={openAdd}><HiOutlinePlus /> Add Section</button></div>
            </div>
            <div className="card">
                <div className="card__header">
                    <div className="search-bar"><HiOutlineMagnifyingGlass className="search-bar__icon" /><input className="search-bar__input" placeholder="Search sections..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--gray-500)' }}>{filtered.length} sections</span>
                </div>
                <div className="card__body" style={{ padding: 0 }}>
                    {filtered.length === 0 ? (
                        <div className="empty-state"><div className="empty-state__icon"><HiOutlineRectangleGroup /></div><div className="empty-state__title">No sections found</div><div className="empty-state__description">Add your first section.</div></div>
                    ) : (
                        <div className="table-wrapper"><table className="table"><thead><tr><th>Section Name</th><th>Department</th><th>Student Count</th><th style={{ width: 120 }}>Actions</th></tr></thead><tbody>
                            {filtered.map(s => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{s.name}</td>
                                    <td><span className="badge badge--neutral">{s.department}</span></td>
                                    <td>{s.studentCount} students</td>
                                    <td><div className="table__actions">
                                        <button className="btn btn--ghost btn--icon btn--sm" onClick={() => openEdit(s)}><HiOutlinePencil /></button>
                                        <button className="btn btn--ghost btn--icon btn--sm" style={{ color: 'var(--error-500)' }} onClick={() => setDeleteConfirm(s)}><HiOutlineTrash /></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody></table></div>
                    )}
                </div>
            </div>

            {modal && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header"><h3 className="modal__title">{modal.mode === 'add' ? 'Add Section' : 'Edit Section'}</h3><button className="modal__close" onClick={() => setModal(null)}><HiOutlineXMark /></button></div>
                        <div className="modal__body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                <div className="form-field"><label className="form-field__label form-field__label--required">Section Name</label><input className={`form-field__input${errors.name ? ' form-field__input--error' : ''}`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. CS-A" />{errors.name && <span className="form-field__error">{errors.name}</span>}</div>
                                <div className="form-grid">
                                    <div className="form-field"><label className="form-field__label form-field__label--required">Department</label><select className={`form-field__input${errors.departmentId ? ' form-field__input--error' : ''}`} value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}><option value="">Select</option>{mockDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>{errors.departmentId && <span className="form-field__error">{errors.departmentId}</span>}</div>
                                    <div className="form-field"><label className="form-field__label form-field__label--required">Student Count</label><input className={`form-field__input${errors.studentCount ? ' form-field__input--error' : ''}`} type="number" min="1" value={form.studentCount} onChange={e => setForm({ ...form, studentCount: e.target.value })} />{errors.studentCount && <span className="form-field__error">{errors.studentCount}</span>}</div>
                                </div>
                            </div>
                        </div>
                        <div className="modal__footer"><button className="btn btn--secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn--primary" onClick={handleSave}>{modal.mode === 'add' ? 'Add' : 'Save'}</button></div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                    <div className="modal__header"><h3 className="modal__title">Delete Section</h3><button className="modal__close" onClick={() => setDeleteConfirm(null)}><HiOutlineXMark /></button></div>
                    <div className="modal__body"><p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-sm)' }}>Delete <strong>{deleteConfirm.name}</strong>?</p></div>
                    <div className="modal__footer"><button className="btn btn--secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button><button className="btn btn--danger" onClick={handleDelete}>Delete</button></div>
                </div></div>
            )}
        </div>
    );
}
