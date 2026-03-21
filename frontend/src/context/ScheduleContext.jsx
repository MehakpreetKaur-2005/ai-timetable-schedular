import { createContext, useContext, useState, useCallback } from 'react';
import { getSystemStatus as fetchStatus } from '../services/api';

const ScheduleContext = createContext(null);

/* ── Default working days & time slots (structural, not mock data) ── */
const DEFAULT_WORKING_DAYS = [
  { day: 'Monday', active: true },
  { day: 'Tuesday', active: true },
  { day: 'Wednesday', active: true },
  { day: 'Thursday', active: true },
  { day: 'Friday', active: true },
  { day: 'Saturday', active: false },
];

const DEFAULT_TIME_SLOTS = [
  { id: 1, label: 'Period 1', start: '09:00', end: '09:50' },
  { id: 2, label: 'Period 2', start: '09:50', end: '10:40' },
  { id: 3, label: 'Period 3', start: '10:50', end: '11:40' },
  { id: 4, label: 'Period 4', start: '11:40', end: '12:30' },
  { id: 5, label: 'Lunch', start: '12:30', end: '13:20' },
  { id: 6, label: 'Period 5', start: '13:20', end: '14:10' },
  { id: 7, label: 'Period 6', start: '14:10', end: '15:00' },
  { id: 8, label: 'Period 7', start: '15:10', end: '16:00' },
];

export function ScheduleProvider({ children }) {
  // Generated schedule data
  const [schedule, setSchedule] = useState(null);
  const [fitnessScore, setFitnessScore] = useState(null);
  const [generationStats, setGenerationStats] = useState(null);
  const [metadata, setMetadata] = useState(null);

  // System status (entity counts from backend)
  const [systemStatus, setSystemStatus] = useState(null);

  // Sync state tracking
  const [lastSynced, setLastSynced] = useState({});

  // ── Shared entity state (replaces mock data) ──
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [workingDays, setWorkingDays] = useState(DEFAULT_WORKING_DAYS);
  const [timeSlots, setTimeSlots] = useState(DEFAULT_TIME_SLOTS);

  const setGeneratedSchedule = useCallback((result) => {
    setSchedule(result.schedule);
    setFitnessScore(result.fitness_score);
    setGenerationStats(result.generation_stats);
    setMetadata(result.metadata);
  }, []);

  const clearSchedule = useCallback(() => {
    setSchedule(null);
    setFitnessScore(null);
    setGenerationStats(null);
    setMetadata(null);
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await fetchStatus();
      setSystemStatus(status);
      return status;
    } catch {
      // Backend might be offline – keep last known status
      return systemStatus;
    }
  }, [systemStatus]);

  const markSynced = useCallback((entity) => {
    setLastSynced(prev => ({ ...prev, [entity]: new Date().toISOString() }));
  }, []);

  return (
    <ScheduleContext.Provider value={{
      schedule, fitnessScore, generationStats, metadata,
      setGeneratedSchedule, clearSchedule,
      systemStatus, refreshStatus,
      lastSynced, markSynced,
      // Shared entity state
      departments, setDepartments,
      faculty, setFaculty,
      subjects, setSubjects,
      sections, setSections,
      rooms, setRooms,
      workingDays, setWorkingDays,
      timeSlots, setTimeSlots,
    }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useSchedule must be used within ScheduleProvider');
  return ctx;
}
