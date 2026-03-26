import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useSchedule } from '../context/ScheduleContext';
import { syncTimeslots } from '../services/api';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineXMark, HiOutlineCheck, HiOutlineClock, HiOutlineArrowPath } from 'react-icons/hi2';

export default function TimeSlots() {
    const notify = useNotification();
    const { markSynced, refreshStatus, workingDays, setWorkingDays, timeSlots, setTimeSlots, userId } = useSchedule();
    const [addModal, setAddModal] = useState(false);
    const [form, setForm] = useState({ label: '', start: '', end: '' });
    const [errors, setErrors] = useState({});
    const [syncing, setSyncing] = useState(false);

    const toggleDay = (idx) => {
        setWorkingDays(workingDays.map((d, i) => i === idx ? { ...d, active: !d.active } : d));
    };

    const validate = () => {
        const errs = {};
        if (!form.label.trim()) errs.label = 'Label is required';
        if (!form.start) errs.start = 'Start time required';
        if (!form.end) errs.end = 'End time required';
        if (form.start && form.end && form.start >= form.end) errs.end = 'End must be after start';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const syncToBackend = async (days, slots) => {
        setSyncing(true);
        try {
            await syncTimeslots(days, slots, userId);
            markSynced('timeslots');
            refreshStatus();
            const activeDayCount = days.filter(d => d.active).length;
            const slotCount = slots.filter(s => s.label !== 'Lunch').length;
            notify.success('Synced with backend', `${activeDayCount * slotCount} time slot(s) synced.`);
        } catch (err) {
            notify.error('Sync failed', err.message);
        } finally {
            setSyncing(false);
        }
    };

    const handleAdd = () => {
        if (!validate()) return;
        const updated = [...timeSlots, { id: Date.now(), ...form }];
        setTimeSlots(updated);
        notify.success('Time slot added', `${form.label} (${form.start} - ${form.end})`);
        setAddModal(false);
        setForm({ label: '', start: '', end: '' });
        syncToBackend(workingDays, updated);
    };

    const handleRemove = (id) => {
        const updated = timeSlots.filter(s => s.id !== id);
        setTimeSlots(updated);
        notify.success('Time slot removed');
        syncToBackend(workingDays, updated);
    };

    const handleSyncNow = () => {
        syncToBackend(workingDays, timeSlots);
    };

    const activeDays = workingDays.filter(d => d.active);

    return (
        <div>
            <div className="page-header">
                <div className="page-header__info"><h2>Time Slots & Working Days</h2><p className="page-header__description">Configure your weekly schedule structure</p></div>
                <div className="page-header__actions" style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    {syncing && <span style={{ fontSize: 'var(--font-xs)', color: 'var(--primary-500)' }}>⟳ Syncing...</span>}
                    <button className="btn btn--secondary" onClick={handleSyncNow} disabled={syncing}>
                        <HiOutlineArrowPath /> Sync to Backend
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                {/* Working Days */}
                <div className="card">
                    <div className="card__header"><h3 className="card__title">Working Days</h3></div>
                    <div className="card__body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {workingDays.map((day, idx) => (
                                <div key={day.day} className={`day-checkbox${day.active ? ' day-checkbox--active' : ''}`} onClick={() => toggleDay(idx)}>
                                    <div className="day-checkbox__box">{day.active && <HiOutlineCheck />}</div>
                                    <span style={{ fontWeight: 500, fontSize: 'var(--font-sm)' }}>{day.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Time Slots */}
                <div className="card">
                    <div className="card__header">
                        <h3 className="card__title">Daily Periods</h3>
                        <button className="btn btn--primary btn--sm" onClick={() => { setForm({ label: '', start: '', end: '' }); setErrors({}); setAddModal(true); }}>
                            <HiOutlinePlus /> Add Slot
                        </button>
                    </div>
                    <div className="card__body" style={{ padding: 0 }}>
                        {timeSlots.length === 0 ? (
                            <div className="empty-state"><div className="empty-state__icon"><HiOutlineClock /></div><div className="empty-state__title">No time slots</div></div>
                        ) : (
                            <div className="table-wrapper"><table className="table"><thead><tr><th>Label</th><th>Start</th><th>End</th><th style={{ width: 60 }}></th></tr></thead><tbody>
                                {timeSlots.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 500 }}>{s.label}</td>
                                        <td>{s.start}</td>
                                        <td>{s.end}</td>
                                        <td><button className="btn btn--ghost btn--icon btn--sm" style={{ color: 'var(--error-500)' }} onClick={() => handleRemove(s.id)}><HiOutlineTrash /></button></td>
                                    </tr>
                                ))}
                            </tbody></table></div>
                        )}
                    </div>
                </div>
            </div>

            {/* Visual Grid Preview */}
            <div className="card">
                <div className="card__header"><h3 className="card__title">Schedule Grid Preview</h3></div>
                <div className="card__body">
                    {activeDays.length === 0 || timeSlots.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--space-8)' }}><div className="empty-state__title">Configure days and time slots to preview</div></div>
                    ) : (
                        <div className="timetable-grid" style={{ gridTemplateColumns: `120px repeat(${timeSlots.length}, 1fr)` }}>
                            <div className="timetable-grid__header"></div>
                            {timeSlots.map(s => (
                                <div className="timetable-grid__header" key={s.id}>{s.label}<br /><span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{s.start}-{s.end}</span></div>
                            ))}
                            {activeDays.map(d => (
                                <React.Fragment key={d.day}>
                                    <div className="timetable-grid__day">{d.day}</div>
                                    {timeSlots.map(s => (
                                        <div className="timetable-grid__cell timetable-grid__cell--empty" key={`${d.day}-${s.id}`}>—</div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {addModal && (
                <div className="modal-overlay" onClick={() => setAddModal(false)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                    <div className="modal__header"><h3 className="modal__title">Add Time Slot</h3><button className="modal__close" onClick={() => setAddModal(false)}><HiOutlineXMark /></button></div>
                    <div className="modal__body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div className="form-field"><label className="form-field__label form-field__label--required">Label</label><input className={`form-field__input${errors.label ? ' form-field__input--error' : ''}`} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. Period 1" />{errors.label && <span className="form-field__error">{errors.label}</span>}</div>
                            <div className="form-grid">
                                <div className="form-field"><label className="form-field__label form-field__label--required">Start</label><input className={`form-field__input${errors.start ? ' form-field__input--error' : ''}`} type="time" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} />{errors.start && <span className="form-field__error">{errors.start}</span>}</div>
                                <div className="form-field"><label className="form-field__label form-field__label--required">End</label><input className={`form-field__input${errors.end ? ' form-field__input--error' : ''}`} type="time" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} />{errors.end && <span className="form-field__error">{errors.end}</span>}</div>
                            </div>
                        </div>
                    </div>
                    <div className="modal__footer"><button className="btn btn--secondary" onClick={() => setAddModal(false)}>Cancel</button><button className="btn btn--primary" onClick={handleAdd}>Add</button></div>
                </div></div>
            )}
        </div>
    );
}
