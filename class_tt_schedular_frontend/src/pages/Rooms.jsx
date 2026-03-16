import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useSchedule } from '../context/ScheduleContext';
import { syncRooms } from '../services/api';
import { mockRooms as initialData } from '../data/mockData';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineHomeModern } from 'react-icons/hi2';

export default function Rooms() {
    const notify = useNotification();
    const { markSynced, refreshStatus } = useSchedule();
    const [rooms, setRooms] = useState(initialData);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [modal, setModal] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [form, setForm] = useState({ name: '', capacity: '', type: 'Classroom' });
    const [errors, setErrors] = useState({});
    const [syncing, setSyncing] = useState(false);

    const filtered = rooms.filter(r => {
        const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
        const matchType = !filterType || r.type === filterType;
        return matchSearch && matchType;
    });

    const openAdd = () => { setForm({ name: '', capacity: '', type: 'Classroom' }); setErrors({}); setModal({ mode: 'add' }); };
    const openEdit = (r) => { setForm({ name: r.name, capacity: String(r.capacity), type: r.type }); setErrors({}); setModal({ mode: 'edit', data: r }); };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Required';
        if (!form.capacity || isNaN(form.capacity) || Number(form.capacity) < 1) errs.capacity = 'Valid capacity required';
        setErrors(errs); return Object.keys(errs).length === 0;
    };

    const syncToBackend = async (updatedRooms) => {
        setSyncing(true);
        try {
            await syncRooms(updatedRooms);
            markSynced('rooms');
            refreshStatus();
            notify.success('Synced with backend', `${updatedRooms.length} room(s) synced.`);
        } catch (err) {
            notify.error('Sync failed', err.message);
        } finally {
            setSyncing(false);
        }
    };

    const handleSave = () => {
        if (!validate()) return;
        const data = { name: form.name, capacity: Number(form.capacity), type: form.type };
        let updated;
        if (modal.mode === 'add') {
            updated = [...rooms, { id: Date.now(), ...data }];
            setRooms(updated);
            notify.success('Room added', `${form.name} created.`);
        } else {
            updated = rooms.map(r => r.id === modal.data.id ? { ...r, ...data } : r);
            setRooms(updated);
            notify.success('Room updated', `${form.name} updated.`);
        }
        setModal(null);
        syncToBackend(updated);
    };

    const handleDelete = () => {
        const updated = rooms.filter(r => r.id !== deleteConfirm.id);
        setRooms(updated);
        notify.success('Room deleted', `${deleteConfirm.name} removed.`);
        setDeleteConfirm(null);
        syncToBackend(updated);
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header__info"><h2>Rooms & Labs</h2><p className="page-header__description">Manage classrooms and laboratories</p></div>
                <div className="page-header__actions" style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    {syncing && <span style={{ fontSize: 'var(--font-xs)', color: 'var(--primary-500)' }}>⟳ Syncing...</span>}
                    <button className="btn btn--primary" onClick={openAdd}><HiOutlinePlus /> Add Room</button>
                </div>
            </div>
            <div className="card">
                <div className="card__header" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                    <div className="search-bar"><HiOutlineMagnifyingGlass className="search-bar__icon" /><input className="search-bar__input" placeholder="Search rooms..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <select className="filter-bar__select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="">All Types</option>
                        <option value="Classroom">Classroom</option>
                        <option value="Lab">Lab</option>
                    </select>
                </div>
                <div className="card__body" style={{ padding: 0 }}>
                    {filtered.length === 0 ? (
                        <div className="empty-state"><div className="empty-state__icon"><HiOutlineHomeModern /></div><div className="empty-state__title">No rooms found</div><div className="empty-state__description">Add your first room or lab.</div></div>
                    ) : (
                        <div className="table-wrapper"><table className="table"><thead><tr><th>Room Name</th><th>Capacity</th><th>Type</th><th style={{ width: 120 }}>Actions</th></tr></thead><tbody>
                            {filtered.map(r => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{r.name}</td>
                                    <td>{r.capacity} seats</td>
                                    <td><span className={`badge ${r.type === 'Lab' ? 'badge--warning' : 'badge--primary'}`}>{r.type}</span></td>
                                    <td><div className="table__actions">
                                        <button className="btn btn--ghost btn--icon btn--sm" onClick={() => openEdit(r)}><HiOutlinePencil /></button>
                                        <button className="btn btn--ghost btn--icon btn--sm" style={{ color: 'var(--error-500)' }} onClick={() => setDeleteConfirm(r)}><HiOutlineTrash /></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody></table></div>
                    )}
                </div>
            </div>

            {modal && (
                <div className="modal-overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
                    <div className="modal__header"><h3 className="modal__title">{modal.mode === 'add' ? 'Add Room' : 'Edit Room'}</h3><button className="modal__close" onClick={() => setModal(null)}><HiOutlineXMark /></button></div>
                    <div className="modal__body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div className="form-field"><label className="form-field__label form-field__label--required">Room Name</label><input className={`form-field__input${errors.name ? ' form-field__input--error' : ''}`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Room 101" />{errors.name && <span className="form-field__error">{errors.name}</span>}</div>
                            <div className="form-grid">
                                <div className="form-field"><label className="form-field__label form-field__label--required">Capacity</label><input className={`form-field__input${errors.capacity ? ' form-field__input--error' : ''}`} type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />{errors.capacity && <span className="form-field__error">{errors.capacity}</span>}</div>
                                <div className="form-field"><label className="form-field__label form-field__label--required">Type</label><select className="form-field__input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="Classroom">Classroom</option><option value="Lab">Lab</option></select></div>
                            </div>
                        </div>
                    </div>
                    <div className="modal__footer"><button className="btn btn--secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn--primary" onClick={handleSave}>{modal.mode === 'add' ? 'Add' : 'Save'}</button></div>
                </div></div>
            )}

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                    <div className="modal__header"><h3 className="modal__title">Delete Room</h3><button className="modal__close" onClick={() => setDeleteConfirm(null)}><HiOutlineXMark /></button></div>
                    <div className="modal__body"><p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-sm)' }}>Delete <strong>{deleteConfirm.name}</strong>?</p></div>
                    <div className="modal__footer"><button className="btn btn--secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button><button className="btn btn--danger" onClick={handleDelete}>Delete</button></div>
                </div></div>
            )}
        </div>
    );
}
