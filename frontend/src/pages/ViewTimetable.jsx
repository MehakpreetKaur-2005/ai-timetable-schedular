import { useState, useMemo } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { HiOutlineArrowDownTray, HiOutlineTableCells } from 'react-icons/hi2';

export default function ViewTimetable() {
    const { schedule } = useSchedule();
    const [viewMode, setViewMode] = useState('section');
    const [selectedFilter, setSelectedFilter] = useState('');

    const hasSchedule = schedule && schedule.length > 0;

    // Extract unique values from schedule for filters
    const { days, timeSlots, sections, faculties, rooms, gridData } = useMemo(() => {
        if (!hasSchedule) return { days: [], timeSlots: [], sections: [], faculties: [], rooms: [], gridData: {} };

        // Get unique days in order
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const uniqueDays = [...new Set(schedule.map(s => s.day))].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

        // Get unique time slots sorted
        const slotSet = new Map();
        schedule.forEach(s => {
            const key = `${s.start_time}-${s.end_time}`;
            if (!slotSet.has(key)) {
                slotSet.set(key, { start: s.start_time, end: s.end_time, label: `${s.start_time}–${s.end_time}` });
            }
        });
        const uniqueSlots = [...slotSet.values()].sort((a, b) => String(a.start).localeCompare(String(b.start)));

        // Unique entities
        const uniqueFaculties = [...new Set(schedule.map(s => s.faculty_name))].sort();
        const uniqueRooms = [...new Set(schedule.map(s => s.room_name))].sort();

        // We don't have explicit sections from backend, so derive "All" for section view
        const uniqueSections = ['All'];

        // Build grid data: { day: { 'start-end': [entries] } }
        const grid = {};
        uniqueDays.forEach(day => {
            grid[day] = {};
            uniqueSlots.forEach(slot => {
                const key = `${slot.start}-${slot.end}`;
                grid[day][key] = schedule.filter(s => s.day === day && s.start_time === slot.start && s.end_time === slot.end);
            });
        });

        return {
            days: uniqueDays,
            timeSlots: uniqueSlots,
            sections: uniqueSections,
            faculties: uniqueFaculties,
            rooms: uniqueRooms,
            gridData: grid,
        };
    }, [schedule, hasSchedule]);

    // Filter grid based on viewMode
    const filterEntry = (entry) => {
        if (!selectedFilter) return true;
        if (viewMode === 'faculty') return entry.faculty_name === selectedFilter;
        if (viewMode === 'room') return entry.room_name === selectedFilter;
        return true;
    };

    // Set initial filter when changing mode
    const handleModeChange = (mode) => {
        setViewMode(mode);
        if (mode === 'faculty') setSelectedFilter(faculties[0] || '');
        else if (mode === 'room') setSelectedFilter(rooms[0] || '');
        else setSelectedFilter('');
    };

    const renderGrid = () => (
        <div className="timetable-grid" style={{ gridTemplateColumns: `120px repeat(${timeSlots.length}, 1fr)` }}>
            <div className="timetable-grid__header"></div>
            {timeSlots.map(s => (
                <div className="timetable-grid__header" key={s.label}>
                    {s.label}
                </div>
            ))}
            {days.map(day => (
                <div key={day} style={{ display: 'contents' }}>
                    <div className="timetable-grid__day">{day}</div>
                    {timeSlots.map(slot => {
                        const key = `${slot.start}-${slot.end}`;
                        const entries = (gridData[day]?.[key] || []).filter(filterEntry);
                        const entry = entries[0];

                        return (
                            <div key={`${day}-${key}`} className={`timetable-grid__cell${entry ? ' timetable-grid__cell--occupied' : ' timetable-grid__cell--empty'}`}>
                                {entry ? (
                                    <>
                                        <span className="timetable-grid__subject">{entry.course_name}</span>
                                        <span className="timetable-grid__faculty">{entry.faculty_name}</span>
                                        <span className="timetable-grid__room">{entry.room_name}</span>
                                    </>
                                ) : '—'}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );

    const handleExport = () => {
        if (!hasSchedule) return;
        
        // CSV Header
        const headers = ['Day', 'Time', 'Course', 'Faculty', 'Room'];
        
        // CSV Rows
        const rows = schedule.map(s => [
            s.day,
            `${s.start_time}-${s.end_time}`,
            s.course_name,
            s.faculty_name,
            s.room_name
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(val => `"${val}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `timetable_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header__info"><h2>View Timetable</h2><p className="page-header__description">Browse generated schedules by view type</p></div>
                <div className="page-header__actions">
                    <button className="btn btn--secondary" disabled={!hasSchedule} onClick={handleExport}><HiOutlineArrowDownTray /> Export</button>
                </div>
            </div>

            <div className="tabs">
                <button className={`tab${viewMode === 'section' ? ' tab--active' : ''}`} onClick={() => handleModeChange('section')}>All Classes</button>
                <button className={`tab${viewMode === 'faculty' ? ' tab--active' : ''}`} onClick={() => handleModeChange('faculty')}>Faculty-wise</button>
                <button className={`tab${viewMode === 'room' ? ' tab--active' : ''}`} onClick={() => handleModeChange('room')}>Room-wise</button>
            </div>

            {!hasSchedule ? (
                <div className="card"><div className="card__body">
                    <div className="empty-state">
                        <div className="empty-state__icon"><HiOutlineTableCells /></div>
                        <div className="empty-state__title">No timetable generated</div>
                        <div className="empty-state__description">Generate a timetable first to view schedules here.</div>
                    </div>
                </div></div>
            ) : (
                <div className="card">
                    <div className="card__header" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                        {viewMode === 'faculty' && (
                            <select className="filter-bar__select" value={selectedFilter} onChange={e => setSelectedFilter(e.target.value)}>
                                {faculties.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        )}
                        {viewMode === 'room' && (
                            <select className="filter-bar__select" value={selectedFilter} onChange={e => setSelectedFilter(e.target.value)}>
                                {rooms.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        )}
                        {viewMode === 'section' && (
                            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--gray-500)' }}>{schedule.length} total assignments</span>
                        )}
                    </div>
                    <div className="card__body" style={{ overflowX: 'auto' }}>
                        {renderGrid()}
                    </div>
                </div>
            )}
        </div>
    );
}
