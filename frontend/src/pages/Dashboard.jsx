import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedule } from '../context/ScheduleContext';
import { getScheduleHistory } from '../services/api';
import {
    HiOutlineUserGroup, HiOutlineBookOpen,
    HiOutlineHomeModern, HiOutlineRectangleGroup,
    HiOutlineBuildingOffice2, HiOutlineCpuChip,
    HiOutlineTableCells, HiOutlineAdjustmentsHorizontal,
    HiOutlineCheckCircle, HiOutlineExclamationTriangle,
    HiOutlineInformationCircle, HiOutlinePlus,
    HiOutlineClock, HiOutlineArrowPath
} from 'react-icons/hi2';

export default function Dashboard() {
    const navigate = useNavigate();
    const { systemStatus, refreshStatus, schedule, fitnessScore, sections, faculty, subjects, rooms, timeSlots, workingDays } = useSchedule();
    const [loaded, setLoaded] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const t = setTimeout(() => setLoaded(true), 60);
        refreshStatus();
        getScheduleHistory().then(data => setHistory(data.history || [])).catch(() => {});
        return () => clearTimeout(t);
    }, []);

    /* ── Timetable Status ── */
    const hasSchedule = schedule && schedule.length > 0;
    const status = {
        state: hasSchedule ? 'generated' : 'not_generated',
        conflicts: 0,
    };

    const statusConfig = {
        not_generated: { label: 'Not Generated', cls: 'pastel-badge--gray' },
        generated: { label: 'Generated', cls: 'pastel-badge--mint' },
        conflicts: { label: 'Conflicts Detected', cls: 'pastel-badge--rose' },
    };
    const badge = statusConfig[status.state];

    /* ── Stats — from context state (Real-time) ── */
    const facultyCount = faculty.length;
    const coursesCount = subjects.length;
    const sectionsCount = sections.length;
    const roomsCount = rooms.length;
    
    // Calculate total possible slots: Active Days * (Time Slots - 1 (Lunch))
    const activeDaysCount = workingDays.filter(d => d.active).length;
    const actualSlotsPerDay = timeSlots.filter(s => s.label !== 'Lunch').length;
    const timeSlotsCount = activeDaysCount * actualSlotsPerDay;

    const stats = [
        { label: 'Faculty', value: facultyCount, icon: <HiOutlineUserGroup />, tint: 'lavender' },
        { label: 'Courses', value: coursesCount, icon: <HiOutlineBookOpen />, tint: 'sky' },
        { label: 'Sections', value: sectionsCount, icon: <HiOutlineRectangleGroup />, tint: 'mint' },
        { label: 'Rooms', value: roomsCount, icon: <HiOutlineHomeModern />, tint: 'peach' },
        { label: 'Time Slots', value: timeSlotsCount, icon: <HiOutlineClock />, tint: 'lilac' },
    ];

    /* ── Quick Actions ── */
    const actions = [
        { label: 'Add Faculty', path: '/admin/faculty', icon: <HiOutlineUserGroup /> },
        { label: 'Add Subject', path: '/admin/subjects', icon: <HiOutlineBookOpen /> },
        { label: 'Add Section', path: '/admin/sections', icon: <HiOutlineRectangleGroup /> },
        { label: 'Add Room', path: '/admin/rooms', icon: <HiOutlineHomeModern /> },
    ];

    /* ── Alerts ── */
    const alerts = [
        status.state === 'not_generated' && { msg: 'No timetable generated yet', severity: 'warn' },
        coursesCount === 0 && { msg: 'No courses synced to backend', severity: 'warn' },
        facultyCount === 0 && { msg: 'No faculty synced to backend', severity: 'warn' },
        roomsCount === 0 && { msg: 'No rooms synced to backend', severity: 'warn' },
        timeSlotsCount === 0 && { msg: 'No time slots synced to backend', severity: 'warn' },
    ].filter(Boolean);
    const allClear = alerts.length === 0;

    /* ── History activity ── */
    const activityIcon = {
        success: <HiOutlineCheckCircle className="pd-activity__icon pd-activity__icon--success" />,
        info: <HiOutlineInformationCircle className="pd-activity__icon pd-activity__icon--info" />,
        warning: <HiOutlineExclamationTriangle className="pd-activity__icon pd-activity__icon--warn" />,
    };

    return (
        <div className={`pd ${loaded ? 'pd--visible' : ''}`}>

            {/* ═══ 1. HERO ═══ */}
            <section className="pd-hero" style={{ animationDelay: '0ms' }}>
                <span className={`pastel-badge ${badge.cls}`}>{badge.label}</span>
                <h2 className="pd-hero__title">Timetable Overview</h2>

                {hasSchedule ? (
                    <p className="pd-hero__meta">
                        Fitness score: <strong>{(fitnessScore * 100).toFixed(1)}%</strong>
                        &nbsp;·&nbsp;
                        <span className="pd-hero__ok">{schedule.length} assignments</span>
                    </p>
                ) : (
                    <p className="pd-hero__meta">Configure your data, then generate a conflict-free schedule.</p>
                )}

                <div className="pd-hero__actions">
                    <button className="pd-btn pd-btn--primary" onClick={() => navigate('/admin/generate')}>
                        <HiOutlineCpuChip />
                        {hasSchedule ? 'Regenerate' : 'Generate Timetable'}
                    </button>
                    {hasSchedule && (
                        <button className="pd-btn pd-btn--secondary" onClick={() => navigate('/admin/timetable')}>
                            <HiOutlineTableCells /> View Timetable
                        </button>
                    )}
                    <button className="pd-btn pd-btn--secondary" onClick={() => refreshStatus()} style={{ opacity: 0.8 }}>
                        <HiOutlineArrowPath /> Refresh Status
                    </button>
                </div>
            </section>

            {/* ═══ 2. STAT CARDS ═══ */}
            <section className="pd-stats" style={{ animationDelay: '80ms' }}>
                {stats.map(s => (
                    <div className={`pd-stat pd-stat--${s.tint}`} key={s.label}>
                        <span className="pd-stat__icon">{s.icon}</span>
                        <span className="pd-stat__value">{s.value}</span>
                        <span className="pd-stat__label">{s.label}</span>
                    </div>
                ))}
            </section>

            {/* ═══ 3. QUICK ACTIONS ═══ */}
            <section className="pd-section" style={{ animationDelay: '160ms' }}>
                <h3 className="pd-section__title">Quick Actions</h3>
                <div className="pd-pills">
                    {actions.map(a => (
                        <button key={a.label} className="pd-pill" onClick={() => navigate(a.path)}>
                            <HiOutlinePlus className="pd-pill__plus" />
                            {a.icon}
                            <span>{a.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* ═══ 4. ALERTS + HISTORY ═══ */}
            <div className="pd-split" style={{ animationDelay: '240ms' }}>

                {/* A — Alerts */}
                <section className="pd-panel">
                    <h3 className="pd-section__title">System Status</h3>
                    <div className="pd-panel__card">
                        {allClear ? (
                            <div className="pd-panel__ok">
                                <HiOutlineCheckCircle />
                                <div>
                                    <strong>All systems ready</strong>
                                    <p>All data synced. Ready for timetable generation.</p>
                                </div>
                            </div>
                        ) : (
                            <ul className="pd-panel__list">
                                {alerts.map((a, i) => (
                                    <li key={i} className={`pd-panel__item pd-panel__item--${a.severity}`}>
                                        <HiOutlineExclamationTriangle />
                                        <span>{a.msg}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                {/* B — Schedule History */}
                <section className="pd-panel">
                    <h3 className="pd-section__title">Schedule History</h3>
                    <div className="pd-panel__card pd-activity-list">
                        {history.length === 0 ? (
                            <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--gray-400)', fontSize: 'var(--font-sm)' }}>
                                No schedules generated yet.
                            </div>
                        ) : (
                            history.map((item, i) => (
                                <div key={i} className="pd-activity" style={{ animationDelay: `${320 + i * 60}ms` }}>
                                    {activityIcon.success}
                                    <div className="pd-activity__body">
                                        <span className="pd-activity__text">Fitness: {(item.fitness * 100).toFixed(1)}%</span>
                                        <span className="pd-activity__time">
                                            <HiOutlineClock /> {new Date(item.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
