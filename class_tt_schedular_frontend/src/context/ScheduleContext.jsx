import { createContext, useContext, useState, useCallback } from 'react';
import { getSystemStatus as fetchStatus } from '../services/api';

const ScheduleContext = createContext(null);

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
