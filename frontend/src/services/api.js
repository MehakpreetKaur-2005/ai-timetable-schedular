import { v4 as uuidv4 } from 'uuid';

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

export async function getSystemStatus(userId) {
  return request(`/system/status?user_id=${userId}`);
}

export async function resetSystem() {
  return request('/system/reset', { method: 'DELETE' });
}

// ─── Departments ──────────────────────────────────────────

export async function syncDepartments(departments, userId) {
  return request('/departments/bulk', {
    method: 'POST',
    body: JSON.stringify({ items: departments, user_id: userId }),
  });
}

export async function getDepartments(userId) {
  return request(`/departments?user_id=${userId}`);
}

// ─── Courses (frontend "Subjects") ───────────────────────

export async function syncCourses(subjects, userId) {
  const courses = subjects.map(s => ({
    id: String(s.id),
    name: s.name,
    duration: Number(s.weeklyHours) || 1,
    student_strength: Number(s.studentCount || s.studentStrength || 60),
    requires_lab: Boolean(s.labRequired),
    subject_code: s.subjectCode,
    theory_hours: Number(s.theoryHours),
    lab_hours: Number(s.labHours),
  }));
  return request('/courses/bulk', {
    method: 'POST',
    body: JSON.stringify({ items: courses, user_id: userId }),
  });
}

export async function getCourses(userId) {
  return request(`/courses?user_id=${userId}`);
}

// ─── Faculty ─────────────────────────────────────────────

export async function syncFaculty(facultyList, userId) {
  const mapped = facultyList.map(f => ({
    id: String(f.id),
    name: f.name,
    email: f.email || '',
    department: f.department || 'General',
    max_hours_per_week: Number(f.maxHours) || 20,
    role: f.role || 'Professor',
    specializations: f.specializations || [],
    department_id: f.departmentId,
  }));
  return request('/faculty/bulk', {
    method: 'POST',
    body: JSON.stringify({ items: mapped, user_id: userId }),
  });
}

export async function getFaculty(userId) {
  return request(`/faculty?user_id=${userId}`);
}

// ─── Rooms ───────────────────────────────────────────────

export async function syncRooms(rooms, userId) {
  const mapped = rooms.map(r => ({
    id: String(r.id),
    name: r.name,
    capacity: Number(r.capacity),
    room_type: (r.type || 'Classroom').toLowerCase() === 'lab' ? 'lab' : 'lecture',
    has_projector: r.hasProjector !== undefined ? r.hasProjector : true,
  }));
  return request('/rooms/bulk', {
    method: 'POST',
    body: JSON.stringify({ items: mapped, user_id: userId }),
  });
}

export async function getRooms(userId) {
  return request(`/rooms?user_id=${userId}`);
}

// ─── Time Slots ──────────────────────────────────────────

export async function syncTimeslots(workingDays, timeSlots, userId) {
  const activeDays = workingDays.filter(d => d.active).map(d => d.day);
  const mapped = [];

  for (const day of activeDays) {
    for (const slot of timeSlots) {
      if (slot.label === 'Lunch') continue; // skip lunch breaks
      mapped.push({
        id: uuidv4(),
        day,
        start_time: slot.start,
        end_time: slot.end,
      });
    }
  }

  return request('/timeslots/bulk', {
    method: 'POST',
    body: JSON.stringify({ items: mapped, user_id: userId }),
  });
}

export async function getTimeslots(userId) {
  return request(`/timeslots?user_id=${userId}`);
}

// ─── Sections ─────────────────────────────────────────────

export async function syncSections(sections, userId) {
  const mapped = sections.map(s => ({
    id: String(s.id),
    name: s.name,
    department: s.department || 'General',
    student_count: Number(s.studentCount),
    department_id: s.departmentId
  }));
  return request('/sections/bulk', {
    method: 'POST',
    body: JSON.stringify({ items: mapped, user_id: userId }),
  });
}

export async function getSections(userId) {
  return request(`/sections?user_id=${userId}`);
}

// ─── Preferences ─────────────────────────────────────────

export async function syncPreferences(assignments, workingDays, timeSlots, userId) {
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
    body: JSON.stringify({ items: preferences, user_id: userId }),
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
