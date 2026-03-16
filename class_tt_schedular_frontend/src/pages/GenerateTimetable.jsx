import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useSchedule } from '../context/ScheduleContext';
import { generateSchedule } from '../services/api';
import { HiOutlineCpuChip, HiOutlineArrowPath, HiOutlineCheckCircle, HiOutlineExclamationTriangle, HiOutlineAdjustmentsHorizontal } from 'react-icons/hi2';

export default function GenerateTimetable() {
    const navigate = useNavigate();
    const notify = useNotification();
    const { setGeneratedSchedule, systemStatus, refreshStatus } = useSchedule();
    const [state, setState] = useState('idle'); // idle | generating | success | error
    const [errorMsg, setErrorMsg] = useState('');
    const [result, setResult] = useState(null);

    // GA parameters
    const [populationSize, setPopulationSize] = useState(100);
    const [generations, setGenerations] = useState(100);
    const [useLearning, setUseLearning] = useState(true);

    const handleGenerate = async () => {
        setState('generating');
        setErrorMsg('');

        try {
            // Refresh status to check if there's data
            const status = await refreshStatus();
            if (status && (status.courses === 0 || status.faculty === 0 || status.rooms === 0 || status.time_slots === 0)) {
                const missing = [];
                if (status.courses === 0) missing.push('Subjects');
                if (status.faculty === 0) missing.push('Faculty');
                if (status.rooms === 0) missing.push('Rooms');
                if (status.time_slots === 0) missing.push('Time Slots');
                throw new Error(`Missing data: ${missing.join(', ')}. Please configure these first.`);
            }

            const data = await generateSchedule({
                populationSize,
                generations,
                useLearning,
            });

            setResult(data);
            setGeneratedSchedule(data);
            setState('success');
            notify.success('Timetable generated!', `Fitness score: ${(data.fitness_score * 100).toFixed(1)}%`);
        } catch (err) {
            setState('error');
            setErrorMsg(err.message);
            notify.error('Generation failed', err.message);
        }
    };

    const handleRegenerate = () => {
        setState('idle');
        setResult(null);
        setErrorMsg('');
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header__info"><h2>Generate Timetable</h2><p className="page-header__description">Use AI-powered Genetic Algorithm to create an optimized schedule</p></div>
            </div>

            {/* GA Parameter Controls */}
            {(state === 'idle' || state === 'error') && (
                <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <div className="card__header"><h3 className="card__title"><HiOutlineAdjustmentsHorizontal style={{ marginRight: 6 }} /> Algorithm Parameters</h3></div>
                    <div className="card__body">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-6)' }}>
                            <div className="form-field">
                                <label className="form-field__label">Population Size</label>
                                <input className="form-field__input" type="number" min="20" max="500" value={populationSize} onChange={e => setPopulationSize(Number(e.target.value))} />
                                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-400)', marginTop: 4 }}>20–500 candidate solutions</span>
                            </div>
                            <div className="form-field">
                                <label className="form-field__label">Generations</label>
                                <input className="form-field__input" type="number" min="10" max="1000" value={generations} onChange={e => setGenerations(Number(e.target.value))} />
                                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-400)', marginTop: 4 }}>10–1000 iterations</span>
                            </div>
                            <div className="form-field">
                                <label className="form-field__label">Use Learning</label>
                                <div className="toggle-field" style={{ marginTop: 8 }}>
                                    <div className={`toggle${useLearning ? ' toggle--active' : ''}`} onClick={() => setUseLearning(!useLearning)}>
                                        <div className="toggle__knob"></div>
                                    </div>
                                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--gray-700)' }}>{useLearning ? 'Enabled' : 'Disabled'}</span>
                                </div>
                                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-400)', marginTop: 4 }}>Learn from previous schedules</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card__body">
                    <div className="generate-hero">
                        {state === 'idle' && (
                            <>
                                <div className="generate-hero__icon"><HiOutlineCpuChip /></div>
                                <h2 className="generate-hero__title">AI Timetable Generator</h2>
                                <p className="generate-hero__description">
                                    The Adaptive Genetic Algorithm will analyze faculty availability, room capacities, subject requirements, and constraints to generate an optimal, conflict-free timetable.
                                </p>
                                <button className="btn btn--primary btn--lg" onClick={handleGenerate} style={{ fontSize: 'var(--font-lg)', padding: 'var(--space-4) var(--space-10)' }}>
                                    <HiOutlineCpuChip /> Generate Timetable
                                </button>
                                <div className="message-box message-box--info" style={{ marginTop: 'var(--space-6)', maxWidth: 440 }}>
                                    Make sure all subjects, faculty, rooms, and time slots are configured and synced before generating.
                                </div>
                            </>
                        )}

                        {state === 'generating' && (
                            <>
                                <div className="generate-hero__icon" style={{ animation: 'spin 2s linear infinite' }}>
                                    <HiOutlineCpuChip />
                                </div>
                                <h2 className="generate-hero__title">Generating Timetable...</h2>
                                <p className="generate-hero__description">
                                    Running Genetic Algorithm with {populationSize} population × {generations} generations.
                                    This may take 10–30 seconds depending on the complexity.
                                </p>
                                <div className="progress-bar" style={{ maxWidth: 400, width: '100%' }}>
                                    <div className="progress-bar__fill" style={{ width: '100%', animation: 'progress-indeterminate 2s ease-in-out infinite' }}></div>
                                </div>
                                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--gray-500)' }}>Processing constraints and optimizing...</p>
                            </>
                        )}

                        {state === 'success' && result && (
                            <>
                                <div className="generate-hero__icon" style={{ background: 'var(--success-50)', color: 'var(--success-500)', animation: 'none' }}>
                                    <HiOutlineCheckCircle />
                                </div>
                                <h2 className="generate-hero__title" style={{ color: 'var(--success-600)' }}>Timetable Generated Successfully!</h2>
                                <p className="generate-hero__description">
                                    {result.schedule.length} class assignments scheduled with a fitness score of <strong>{(result.fitness_score * 100).toFixed(1)}%</strong>.
                                </p>

                                {/* Fitness & Stats Summary */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', maxWidth: 500, width: '100%', margin: 'var(--space-4) 0' }}>
                                    <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--gray-50)', borderRadius: 8 }}>
                                        <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--primary-600)' }}>{(result.fitness_score * 100).toFixed(1)}%</div>
                                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-500)' }}>Fitness Score</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--gray-50)', borderRadius: 8 }}>
                                        <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--primary-600)' }}>{result.schedule.length}</div>
                                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-500)' }}>Assignments</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--gray-50)', borderRadius: 8 }}>
                                        <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--primary-600)' }}>{result.metadata?.generations || generations}</div>
                                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-500)' }}>Generations</div>
                                    </div>
                                </div>

                                {/* AI Analysis */}
                                {result.metadata?.ai_analysis && (
                                    <div className="message-box message-box--info" style={{ maxWidth: 600, textAlign: 'left', marginBottom: 'var(--space-4)' }}>
                                        <strong>🤖 AI Analysis:</strong><br />
                                        {typeof result.metadata.ai_analysis === 'string' 
                                            ? result.metadata.ai_analysis 
                                            : <ul style={{ margin: '8px 0 0 20px' }}>
                                                {result.metadata.ai_analysis.improvement_suggestions?.map?.((s, i) => <li key={i}>{s}</li>) || <li>Review AI output for suggestions.</li>}
                                              </ul>}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                    <button className="btn btn--primary btn--lg" onClick={() => navigate('/admin/timetable')}>
                                        View Timetable
                                    </button>
                                    <button className="btn btn--secondary btn--lg" onClick={handleRegenerate}>
                                        <HiOutlineArrowPath /> Regenerate
                                    </button>
                                </div>
                            </>
                        )}

                        {state === 'error' && (
                            <>
                                <div className="generate-hero__icon" style={{ background: 'var(--error-50)', color: 'var(--error-500)', animation: 'none' }}>
                                    <HiOutlineExclamationTriangle />
                                </div>
                                <h2 className="generate-hero__title" style={{ color: 'var(--error-600)' }}>Generation Failed</h2>
                                <p className="generate-hero__description" style={{ maxWidth: 500 }}>
                                    {errorMsg || 'Unable to generate a timetable. Review your configurations and try again.'}
                                </p>
                                <button className="btn btn--primary btn--lg" onClick={handleRegenerate}>
                                    <HiOutlineArrowPath /> Try Again
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
