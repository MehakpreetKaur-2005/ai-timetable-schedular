import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useSchedule } from '../context/ScheduleContext';
import { syncPreferences, syncFaculty } from '../services/api';
import { mockFaculty, mockSubjects, mockWorkingDays, mockTimeSlots } from '../data/mockData';
import { HiOutlineCheck, HiOutlineXMark } from 'react-icons/hi2';

export default function Workload() {
    const notify = useNotification();
    const { markSynced, refreshStatus } = useSchedule();
    const [assignments, setAssignments] = useState(() => {
        return mockFaculty.map(f => ({
            ...f,
            subjects: mockSubjects.filter(s => s.departmentId === f.departmentId).map(s => s.id),
            unavailable: {},
        }));
    });
    const [selectedFaculty, setSelectedFaculty] = useState(assignments[0]?.id || null);
    const [syncing, setSyncing] = useState(false);

    const activeDays = mockWorkingDays.filter(d => d.active);
    const periods = mockTimeSlots.filter(s => s.label !== 'Lunch');
    const currentFaculty = assignments.find(a => a.id === selectedFaculty);

    const toggleUnavailable = (day, slotId) => {
        setAssignments(assignments.map(a => {
            if (a.id !== selectedFaculty) return a;
            const key = `${day}-${slotId}`;
            const unavailable = { ...a.unavailable };
            if (unavailable[key]) delete unavailable[key];
            else unavailable[key] = true;
            return { ...a, unavailable };
        }));
    };

    const toggleSubject = (facultyId, subjectId) => {
        setAssignments(assignments.map(a => {
            if (a.id !== facultyId) return a;
            const subjects = a.subjects.includes(subjectId)
                ? a.subjects.filter(id => id !== subjectId)
                : [...a.subjects, subjectId];
            return { ...a, subjects };
        }));
    };

    const handleSave = async () => {
        setSyncing(true);
        try {
            // Sync faculty (with specializations derived from assigned subjects)
            const facultyData = assignments.map(a => ({
                ...a,
                specializations: mockSubjects
                    .filter(s => a.subjects.includes(s.id))
                    .map(s => s.name),
            }));
            await syncFaculty(facultyData);
            markSynced('faculty');

            // Sync preferences (availability grid → preference_level)
            await syncPreferences(assignments, mockWorkingDays, mockTimeSlots);
            markSynced('preferences');

            refreshStatus();
            notify.success('Configuration saved', 'Faculty workload, subjects, and availability synced with backend.');
        } catch (err) {
            notify.error('Sync failed', err.message);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header__info"><h2>Workload & Availability</h2><p className="page-header__description">Configure faculty hours, availability, and subject assignments</p></div>
                <div className="page-header__actions" style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    {syncing && <span style={{ fontSize: 'var(--font-xs)', color: 'var(--primary-500)' }}>⟳ Syncing...</span>}
                    <button className="btn btn--primary" onClick={handleSave} disabled={syncing}>
                        {syncing ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--space-6)' }}>
                {/* Faculty List */}
                <div className="card">
                    <div className="card__header"><h3 className="card__title">Faculty</h3></div>
                    <div className="card__body" style={{ padding: 0 }}>
                        {assignments.map(f => (
                            <div key={f.id}
                                onClick={() => setSelectedFaculty(f.id)}
                                style={{
                                    padding: 'var(--space-3) var(--space-4)',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--gray-100)',
                                    background: selectedFaculty === f.id ? 'var(--primary-50)' : 'transparent',
                                    borderLeft: selectedFaculty === f.id ? '3px solid var(--primary-600)' : '3px solid transparent',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--gray-900)' }}>{f.name}</div>
                                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-500)', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                                    <span>{f.department}</span>
                                    <span>{f.maxHours}h max</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    {currentFaculty && (
                        <>
                            {/* Subject Assignments */}
                            <div className="card">
                                <div className="card__header"><h3 className="card__title">Subject Assignments — {currentFaculty.name}</h3></div>
                                <div className="card__body">
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                                        {mockSubjects.map(s => {
                                            const assigned = currentFaculty.subjects.includes(s.id);
                                            return (
                                                <button key={s.id}
                                                    className={`btn btn--sm ${assigned ? 'btn--primary' : 'btn--secondary'}`}
                                                    onClick={() => toggleSubject(currentFaculty.id, s.id)}
                                                >
                                                    {assigned && <HiOutlineCheck />} {s.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Availability Grid */}
                            <div className="card">
                                <div className="card__header">
                                    <h3 className="card__title">Availability Grid</h3>
                                    <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--font-xs)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}><span style={{ width: 12, height: 12, background: 'var(--success-50)', border: '1px solid var(--success-500)', borderRadius: 3 }}></span> Available</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}><span style={{ width: 12, height: 12, background: 'var(--error-50)', border: '1px solid var(--error-500)', borderRadius: 3 }}></span> Unavailable</span>
                                    </div>
                                </div>
                                <div className="card__body">
                                    <div className="availability-grid" style={{ gridTemplateColumns: `100px repeat(${periods.length}, 1fr)` }}>
                                        <div className="availability-grid__cell availability-grid__cell--header">Day</div>
                                        {periods.map(p => <div key={p.id} className="availability-grid__cell availability-grid__cell--header">{p.label}</div>)}
                                        {activeDays.map(d => (
                                            <>
                                                <div key={d.day} className="availability-grid__cell availability-grid__cell--header">{d.day.slice(0, 3)}</div>
                                                {periods.map(p => {
                                                    const unavail = currentFaculty.unavailable[`${d.day}-${p.id}`];
                                                    return (
                                                        <div key={`${d.day}-${p.id}`}
                                                            className={`availability-grid__cell ${unavail ? 'availability-grid__cell--unavailable' : 'availability-grid__cell--available'}`}
                                                            onClick={() => toggleUnavailable(d.day, p.id)}
                                                            title={unavail ? 'Click to mark available' : 'Click to mark unavailable'}
                                                        >
                                                            {unavail ? <HiOutlineXMark /> : <HiOutlineCheck />}
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
