import { useState, useEffect, useMemo } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { getLearningPatterns, getAIInsights } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function Analytics() {
    const { schedule, fitnessScore } = useSchedule();
    const [patterns, setPatterns] = useState(null);
    const [insights, setInsights] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(false);

    const hasSchedule = schedule && schedule.length > 0;

    useEffect(() => {
        getLearningPatterns().then(setPatterns).catch(() => {});
    }, []);

    const handleGetInsights = async () => {
        setLoadingInsights(true);
        try {
            const data = await getAIInsights();
            setInsights(data);
        } catch {
            setInsights({ insights: 'Unable to get AI insights. Make sure the backend is running and has data.' });
        } finally {
            setLoadingInsights(false);
        }
    };

    // Derive analytics from schedule
    const { facultyWorkload, roomUtilization, periodStats } = useMemo(() => {
        if (!hasSchedule) {
            return {
                facultyWorkload: [],
                roomUtilization: [],
                periodStats: { occupied: 0, free: 100 },
            };
        }

        // Faculty workload
        const facultyMap = {};
        schedule.forEach(entry => {
            if (!facultyMap[entry.faculty_name]) {
                facultyMap[entry.faculty_name] = { name: entry.faculty_name, hours: 0 };
            }
            facultyMap[entry.faculty_name].hours += 1;
        });
        const facultyData = Object.values(facultyMap).sort((a, b) => b.hours - a.hours);

        // Room utilization — count unique slots per room
        const roomMap = {};
        const totalSlots = new Set();
        schedule.forEach(entry => {
            const slotKey = `${entry.day}-${entry.start_time}`;
            totalSlots.add(slotKey);
            if (!roomMap[entry.room_name]) {
                roomMap[entry.room_name] = new Set();
            }
            roomMap[entry.room_name].add(slotKey);
        });
        const totalSlotCount = totalSlots.size || 1;
        const roomData = Object.entries(roomMap).map(([name, slots]) => ({
            name,
            utilization: Math.round((slots.size / totalSlotCount) * 100),
        })).sort((a, b) => b.utilization - a.utilization);

        // Period stats
        const daySlotPairs = new Set();
        const occupiedPairs = new Set();
        schedule.forEach(entry => {
            daySlotPairs.add(`${entry.day}-${entry.start_time}-${entry.end_time}`);
            occupiedPairs.add(`${entry.day}-${entry.start_time}-${entry.end_time}`);
        });
        const occupiedPct = daySlotPairs.size > 0 ? Math.round((occupiedPairs.size / Math.max(daySlotPairs.size, 1)) * 100) : 0;

        return {
            facultyWorkload: facultyData,
            roomUtilization: roomData,
            periodStats: { occupied: occupiedPct, free: 100 - occupiedPct },
        };
    }, [schedule, hasSchedule]);

    const pieData = [
        { name: 'Occupied', value: periodStats.occupied },
        { name: 'Free', value: periodStats.free },
    ];

    return (
        <div>
            <div className="page-header">
                <div className="page-header__info"><h2>Analytics</h2><p className="page-header__description">Insights into scheduling efficiency</p></div>
                <div className="page-header__actions">
                    <button className="btn btn--secondary" onClick={handleGetInsights} disabled={loadingInsights}>
                        {loadingInsights ? '⟳ Loading...' : '🤖 Get AI Insights'}
                    </button>
                </div>
            </div>

            {/* AI Insights Banner */}
            {insights && (
                <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <div className="card__header"><h3 className="card__title">🤖 AI Scheduling Insights</h3></div>
                    <div className="card__body">
                        <p style={{ whiteSpace: 'pre-wrap', color: 'var(--gray-700)', fontSize: 'var(--font-sm)', lineHeight: 1.6 }}>
                            {insights.insights || 'No insights available.'}
                        </p>
                    </div>
                </div>
            )}

            {!hasSchedule ? (
                <div className="card"><div className="card__body">
                    <div className="empty-state">
                        <div className="empty-state__icon">📊</div>
                        <div className="empty-state__title">No schedule data</div>
                        <div className="empty-state__description">Generate a timetable first to see analytics.</div>
                    </div>
                </div></div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
                        <div className="stat-card">
                            <div className="stat-card__icon stat-card__icon--indigo">📊</div>
                            <div className="stat-card__info"><div className="stat-card__label">Avg Faculty Load</div><div className="stat-card__value">{facultyWorkload.length > 0 ? Math.round(facultyWorkload.reduce((a, f) => a + f.hours, 0) / facultyWorkload.length) : 0}h</div></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__icon stat-card__icon--emerald">🏫</div>
                            <div className="stat-card__info"><div className="stat-card__label">Fitness Score</div><div className="stat-card__value">{fitnessScore ? (fitnessScore * 100).toFixed(1) : 0}%</div></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__icon stat-card__icon--amber">⏰</div>
                            <div className="stat-card__info"><div className="stat-card__label">Total Assignments</div><div className="stat-card__value">{schedule.length}</div></div>
                        </div>
                        {patterns && (
                            <div className="stat-card">
                                <div className="stat-card__icon stat-card__icon--indigo">🧠</div>
                                <div className="stat-card__info"><div className="stat-card__label">Learned Patterns</div><div className="stat-card__value">{patterns.pattern_count || 0}</div></div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                        {/* Faculty Workload Chart */}
                        <div className="card">
                            <div className="card__header"><h3 className="card__title">Faculty Workload Distribution</h3></div>
                            <div className="card__body">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={facultyWorkload} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                                        <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} name="Hours Assigned" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Room Utilization Chart */}
                        <div className="card">
                            <div className="card__header"><h3 className="card__title">Room Utilization</h3></div>
                            <div className="card__body">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={roomUtilization} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#6b7280' }} unit="%" />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} width={80} />
                                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} formatter={(value) => `${value}%`} />
                                        <Bar dataKey="utilization" radius={[0, 4, 4, 0]} name="Utilization">
                                            {roomUtilization.map((_, idx) => (
                                                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Learning Patterns */}
                    {patterns && patterns.patterns && patterns.patterns.length > 0 && (
                        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                            <div className="card__header"><h3 className="card__title">🧠 Learned Scheduling Patterns</h3></div>
                            <div className="card__body" style={{ padding: 0 }}>
                                <div className="table-wrapper"><table className="table"><thead><tr><th>Type</th><th>Details</th><th>Strength</th></tr></thead><tbody>
                                    {patterns.patterns.slice(0, 15).map((p, i) => (
                                        <tr key={i}>
                                            <td><span className="badge badge--primary">{p.type}</span></td>
                                            <td style={{ fontSize: 'var(--font-sm)' }}>
                                                {p.course && `Course: ${p.course}`}
                                                {p.faculty && ` → Faculty: ${p.faculty}`}
                                                {p.timeslot && ` @ ${p.timeslot}`}
                                            </td>
                                            <td><strong>{p.strength}</strong></td>
                                        </tr>
                                    ))}
                                </tbody></table></div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
