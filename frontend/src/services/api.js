/**
 * API Service Layer
 * Centralized client for all backend API communication
 * Backend: FastAPI at /api (proxied via Vite dev server)
 */

const API_BASE = '/api';

/**
 * Generic fetch wrapper with error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.detail || `Request failed (${response.status})`;
      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to backend server. Is it running on port 8000?');
    }
    throw error;
  }
}

// ─── System ──────────────────────────────────────────────

export async function getSystemStatus() {
  return request('/system/status');
}

export async function resetSystem() {
  return request('/system/reset', { method: 'DELETE' });
}

// ─── Courses (frontend "Subjects") ───────────────────────

export async function syncCourses(subjects) {
  const courses = subjects.map(s => ({
    id: String(s.id),
    name: s.name,
    duration: Number(s.weeklyHours) || 1,
    student_strength: Number(s.studentCount || s.studentStrength || 60),
    requires_lab: Boolean(s.labRequired),
  }));
  return request('/courses/bulk', {
    method: 'POST',
    body: JSON.stringify(courses),
  });
}

// ─── Faculty ─────────────────────────────────────────────

export async function syncFaculty(facultyList) {
  const mapped = facultyList.map(f => ({
    id: String(f.id),
    name: f.name,
    department: f.department || 'General',
    max_hours_per_week: Number(f.maxHours) || 20,
    specializations: f.specializations || [],
  }));
  return request('/faculty/bulk', {
    method: 'POST',
    body: JSON.stringify(mapped),
  });
}

// ─── Rooms ───────────────────────────────────────────────

export async function syncRooms(rooms) {
  const mapped = rooms.map(r => ({
    id: String(r.id),
    name: r.name,
    capacity: Number(r.capacity),
    room_type: (r.type || 'Classroom').toLowerCase() === 'lab' ? 'lab' : 'lecture',
    has_projector: r.hasProjector !== undefined ? r.hasProjector : true,
  }));
  return request('/rooms/bulk', {
    method: 'POST',
    body: JSON.stringify(mapped),
  });
}

// ─── Time Slots ──────────────────────────────────────────

export async function syncTimeslots(workingDays, timeSlots) {
  const activeDays = workingDays.filter(d => d.active).map(d => d.day);
  const mapped = [];
  let counter = 1;

  for (const day of activeDays) {
    for (const slot of timeSlots) {
      if (slot.label === 'Lunch') continue; // skip lunch breaks
      mapped.push({
        id: `TS${String(counter).padStart(3, '0')}`,
        day,
        start_time: slot.start,
        end_time: slot.end,
      });
      counter++;
    }
  }

  return request('/timeslots/bulk', {
    method: 'POST',
    body: JSON.stringify(mapped),
  });
}

// ─── Preferences ─────────────────────────────────────────

export async function syncPreferences(assignments, workingDays, timeSlots) {
  const activeDays = workingDays.filter(d => d.active).map(d => d.day);
  const periods = timeSlots.filter(s => s.label !== 'Lunch');
  const preferences = [];

  for (const faculty of assignments) {
    let slotCounter = 1;
    for (const day of activeDays) {
      for (const period of periods) {
        const tsId = `TS${String(slotCounter).padStart(3, '0')}`;
        const key = `${day}-${period.id}`;
        const isUnavailable = faculty.unavailable?.[key];

        preferences.push({
          faculty_id: String(faculty.id),
          timeslot_id: tsId,
          preference_level: isUnavailable ? 1 : 5,
        });
        slotCounter++;
      }
    }
  }

  return request('/preferences/bulk', {
    method: 'POST',
    body: JSON.stringify(preferences),
  });
}

// ─── Schedule Generation ─────────────────────────────────

export async function generateSchedule({
  populationSize = 100,
  generations = 100,
  useLearning = true,
  useAiOptimization = true,
  aiOptimizationRounds = 3,
} = {}) {
  return request('/schedule/generate', {
    method: 'POST',
    body: JSON.stringify({
      population_size: populationSize,
      generations: generations,
      use_learning: useLearning,
      use_ai_optimization: useAiOptimization,
      ai_optimization_rounds: aiOptimizationRounds,
    }),
  });
}

// ─── Schedule History & Learning ─────────────────────────

export async function getScheduleHistory() {
  return request('/schedule/history');
}

export async function getLearningPatterns() {
  return request('/learning/patterns');
}

// ─── AI Features ─────────────────────────────────────────

export async function getAIInsights() {
  return request('/ai/insights');
}

export async function analyzeSchedule(scheduleData) {
  return request('/ai/analyze-schedule', {
    method: 'POST',
    body: JSON.stringify(scheduleData),
  });
}

export async function analyzeFacultyFit(courseId) {
  return request(`/ai/analyze-faculty-fit?course_id=${encodeURIComponent(courseId)}`, {
    method: 'POST',
  });
}
