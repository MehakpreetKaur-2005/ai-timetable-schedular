import { useState, useMemo } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useSchedule } from '../context/ScheduleContext';
import { analyzeSchedule } from '../services/api';
import { HiOutlineExclamationTriangle, HiOutlineSparkles } from 'react-icons/hi2';

export default function EditTimetable() {
    const notify = useNotification();
    const { schedule } = useSchedule();
    const hasSchedule = schedule && schedule.length > 0;

    // Build editable grid from schedule
    const { days, timeSlots, initialGrid } = useMemo(() => {
        if (!hasSchedule) return { days: [], timeSlots: [], initialGrid: {} };

        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const uniqueDays = [...new Set(schedule.map(s => s.day))].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

        const slotSet = new Map();
        schedule.forEach(s => {
            const key = `${s.start_time}-${s.end_time}`;
            if (!slotSet.has(key)) slotSet.set(key, { start: s.start_time, end: s.end_time, label: `${s.start_time}–${s.end_time}` });
        });
        const slots = [...slotSet.values()].sort((a, b) => String(a.start).localeCompare(String(b.start)));

        const grid = {};
        uniqueDays.forEach(day => {
            grid[day] = [];
            slots.forEach(slot => {
                const entry = schedule.find(s => s.day === day && s.start_time === slot.start && s.end_time === slot.end);
                grid[day].push(entry ? { subject: entry.course_name, faculty: entry.faculty_name, room: entry.room_name } : null);
            });
        });

        return { days: uniqueDays, timeSlots: slots, initialGrid: grid };
    }, [schedule, hasSchedule]);

    const [timetable, setTimetable] = useState(initialGrid);
    const [editing, setEditing] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    // Get unique values for dropdowns
    const uniqueSubjects = hasSchedule ? [...new Set(schedule.map(s => s.course_name))].sort() : [];
    const uniqueFaculties = hasSchedule ? [...new Set(schedule.map(s => s.faculty_name))].sort() : [];
    const uniqueRooms = hasSchedule ? [...new Set(schedule.map(s => s.room_name))].sort() : [];

    const currentCell = editing ? (timetable[editing.day]?.[editing.periodIdx] || null) : null;

    const handleChange = (field, value) => {
        if (!editing) return;
        const updated = { ...timetable };
        if (!updated[editing.day]) updated[editing.day] = [];
        if (!updated[editing.day][editing.periodIdx]) {
            updated[editing.day][editing.periodIdx] = { subject: '', faculty: '', room: '' };
        }
        updated[editing.day][editing.periodIdx] = { ...updated[editing.day][editing.periodIdx], [field]: value };
        setTimetable(updated);
    };

    const handleSave = () => {
        notify.success('Timetable saved', 'Schedule changes have been applied locally.');
        setEditing(null);
    };

    const handleAIAnalysis = async () => {
        setAnalyzing(true);
        try {
            // Flatten grid back to schedule format for AI analysis
            const flatSchedule = [];
            days.forEach(day => {
                (timetable[day] || []).forEach((cell, idx) => {
                    if (cell) {
                        flatSchedule.push({
                            course_name: cell.subject,
                            faculty_name: cell.faculty,
                            room_name: cell.room,
                            day,
                            start_time: timeSlots[idx]?.start,
                            end_time: timeSlots[idx]?.end,
                        });
                    }
                });
            });

            const result = await analyzeSchedule(flatSchedule);
            notify.success('AI Analysis Complete', result.analysis || 'Analysis received.');
        } catch (err) {
            notify.error('Analysis failed', err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    if (!hasSchedule) {
        return (
            <div>
                <div className="page-header">
                    <div className="page-header__info"><h2>Edit Schedule</h2><p className="page-header__description">Generate a timetable first to edit it</p></div>
                </div>
                <div className="card"><div className="card__body">
                    <div className="empty-state">
                        <div className="empty-state__icon"><HiOutlineExclamationTriangle /></div>
                        <div className="empty-state__title">No timetable to edit</div>
                        <div className="empty-state__description">Go to Generate Timetable first, then come back to make manual adjustments.</div>
                    </div>
                </div></div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header__info"><h2>Edit Schedule</h2><p className="page-header__description">Manually adjust the generated timetable</p></div>
                <div className="page-header__actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn btn--secondary" onClick={handleAIAnalysis} disabled={analyzing}>
                        <HiOutlineSparkles /> {analyzing ? 'Analyzing...' : 'AI Analysis'}
                    </button>
                    <button className="btn btn--primary" onClick={handleSave}>Save Changes</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-6)' }}>
                {/* Timetable Grid */}
                <div className="card">
                    <div className="card__header"><h3 className="card__title">Schedule Grid</h3></div>
                    <div className="card__body" style={{ overflowX: 'auto' }}>
                        <div className="timetable-grid" style={{ gridTemplateColumns: `120px repeat(${timeSlots.length}, 1fr)` }}>
                            <div className="timetable-grid__header"></div>
                            {timeSlots.map(s => (
                                <div className="timetable-grid__header" key={s.label}>{s.label}</div>
                            ))}
                            {days.map(day => (
                                <>
                                    <div className="timetable-grid__day" key={day}>{day}</div>
                                    {timeSlots.map((p, idx) => {
                                        const cell = timetable[day]?.[idx];
                                        const isEditing = editing?.day === day && editing?.periodIdx === idx;
                                        return (
                                            <div key={`${day}-${idx}`}
                                                className={`timetable-grid__cell${cell ? ' timetable-grid__cell--occupied' : ' timetable-grid__cell--empty'}`}
                                                style={{
                                                    cursor: 'pointer',
                                                    outline: isEditing ? '2px solid var(--primary-500)' : 'none',
                                                    outlineOffset: -2,
                                                }}
                                                onClick={() => setEditing({ day, periodIdx: idx })}
                                            >
                                                {cell ? (
                                                    <>
                                                        <span className="timetable-grid__subject">{cell.subject}</span>
                                                        <span className="timetable-grid__faculty" style={{ fontSize: '0.65rem' }}>{cell.faculty}</span>
                                                        <span className="timetable-grid__room" style={{ fontSize: '0.65rem' }}>{cell.room}</span>
                                                    </>
                                                ) : '—'}
                                            </div>
                                        );
                                    })}
                                </>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Edit Panel */}
                <div className="card" style={{ position: 'sticky', top: 'calc(var(--header-height) + var(--space-8))', alignSelf: 'start' }}>
                    <div className="card__header"><h3 className="card__title">Edit Slot</h3></div>
                    <div className="card__body">
                        {editing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--gray-500)', marginBottom: 'var(--space-2)' }}>
                                    <strong>{editing.day}</strong> — {timeSlots[editing.periodIdx]?.label}
                                </div>
                                <div className="form-field">
                                    <label className="form-field__label">Subject</label>
                                    <select className="form-field__input" value={currentCell?.subject || ''} onChange={e => handleChange('subject', e.target.value)}>
                                        <option value="">— None —</option>
                                        {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label className="form-field__label">Faculty</label>
                                    <select className="form-field__input" value={currentCell?.faculty || ''} onChange={e => handleChange('faculty', e.target.value)}>
                                        <option value="">— None —</option>
                                        {uniqueFaculties.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label className="form-field__label">Room</label>
                                    <select className="form-field__input" value={currentCell?.room || ''} onChange={e => handleChange('room', e.target.value)}>
                                        <option value="">— None —</option>
                                        {uniqueRooms.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <button className="btn btn--secondary btn--sm" onClick={() => {
                                    const updated = { ...timetable };
                                    if (updated[editing.day]) updated[editing.day][editing.periodIdx] = null;
                                    setTimetable(updated);
                                }}>Clear Slot</button>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--gray-400)', fontSize: 'var(--font-sm)', textAlign: 'center', padding: 'var(--space-6) 0' }}>
                                Click a cell in the timetable to edit it.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
