import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  getSystemStatus as fetchStatus,
  getCourses,
  getFaculty,
  getRooms,
  getTimeslots,
  getDepartments,
  getSections
} from '../services/api';
import { useAuth } from './AuthContext';

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
  const { user } = useAuth();
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
  const [userId, setUserId] = useState(user?.id || null);

  // Sync userId with Auth context
  useEffect(() => {
    setUserId(user?.id || null);
  }, [user]);

  // Load user data from backend (Hydration)
  useEffect(() => {
    if (userId) {
      loadUserData(userId);
    }
  }, [userId]);

  const loadUserData = async (uid) => {
    try {
      const [fData, cData, rData, tData, dData, sData] = await Promise.all([
        getFaculty(uid),
        getCourses(uid),
        getRooms(uid),
        getTimeslots(uid),
        getDepartments(uid),
        getSections(uid)
      ]);

      if (dData) setDepartments(dData.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code
      })));

      if (fData) setFaculty(fData.map(f => ({
        id: f.id,
        name: f.name,
        email: f.email || '',
        department: f.department,
        departmentId: f.department_id,
        maxHours: f.max_hours_per_week,
        role: f.role || 'Professor',
        specializations: f.specializations || []
      })));

      if (cData) setSubjects(cData.map(c => ({
        id: c.id,
        name: c.name,
        weeklyHours: c.weekly_hours,
        studentStrength: c.student_strength,
        labRequired: c.is_lab,
        theoryHours: c.theory_hours,
        labHours: c.lab_hours,
        subjectCode: c.subject_code
      })));

      if (rData) setRooms(rData.map(r => ({
        id: r.id,
        name: r.name,
        capacity: r.capacity,
        type: r.room_type === 'lab' ? 'Lab' : 'Classroom'
      })));

      if (sData) setSections(sData.map(s => ({
        id: s.id,
        name: s.name,
        department: s.department,
        departmentId: s.department_id,
        studentCount: s.student_count
      })));

      // For timeslots, we mainly use them to set active working days
      if (tData && tData.length > 0) {
        const daysPresent = [...new Set(tData.map(t => t.day))];
        setWorkingDays(prev => prev.map(d => ({
          ...d,
          active: daysPresent.includes(d.day)
        })));
      }
    } catch (err) {
      console.error("Failed to hydrate schedule data:", err);
    }
  };

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
    if (!userId) return;
    try {
      const status = await fetchStatus(userId);
      setSystemStatus(status);
      return status;
    } catch {
      // Backend might be offline – keep last known status
      return systemStatus;
    }
  }, [systemStatus, userId]);

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
      userId,
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
