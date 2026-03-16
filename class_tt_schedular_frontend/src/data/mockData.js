export const mockDepartments = [
  { id: 1, name: 'Computer Science', code: 'CS' },
  { id: 2, name: 'Electronics & Communication', code: 'ECE' },
  { id: 3, name: 'Mechanical Engineering', code: 'ME' },
  { id: 4, name: 'Civil Engineering', code: 'CE' },
  { id: 5, name: 'Mathematics', code: 'MATH' },
];

export const mockFaculty = [
  { id: 1, name: 'Dr. Ananya Sharma', email: 'ananya@schedulai.edu', departmentId: 1, department: 'Computer Science', maxHours: 18 },
  { id: 2, name: 'Prof. Rajesh Kumar', email: 'rajesh@schedulai.edu', departmentId: 2, department: 'Electronics & Communication', maxHours: 16 },
  { id: 3, name: 'Dr. Priya Patel', email: 'priya@schedulai.edu', departmentId: 1, department: 'Computer Science', maxHours: 20 },
  { id: 4, name: 'Prof. Suresh Reddy', email: 'suresh@schedulai.edu', departmentId: 3, department: 'Mechanical Engineering', maxHours: 18 },
  { id: 5, name: 'Dr. Meena Iyer', email: 'meena@schedulai.edu', departmentId: 5, department: 'Mathematics', maxHours: 16 },
  { id: 6, name: 'Prof. Vikram Singh', email: 'vikram@schedulai.edu', departmentId: 4, department: 'Civil Engineering', maxHours: 14 },
];

export const mockSubjects = [
  { id: 1, name: 'Data Structures', departmentId: 1, department: 'Computer Science', weeklyHours: 4, labRequired: false },
  { id: 2, name: 'Database Management', departmentId: 1, department: 'Computer Science', weeklyHours: 5, labRequired: true },
  { id: 3, name: 'Digital Electronics', departmentId: 2, department: 'Electronics & Communication', weeklyHours: 4, labRequired: true },
  { id: 4, name: 'Thermodynamics', departmentId: 3, department: 'Mechanical Engineering', weeklyHours: 3, labRequired: false },
  { id: 5, name: 'Calculus II', departmentId: 5, department: 'Mathematics', weeklyHours: 4, labRequired: false },
  { id: 6, name: 'Structural Analysis', departmentId: 4, department: 'Civil Engineering', weeklyHours: 3, labRequired: false },
  { id: 7, name: 'Operating Systems', departmentId: 1, department: 'Computer Science', weeklyHours: 4, labRequired: true },
];

export const mockSections = [
  { id: 1, name: 'CS-A', departmentId: 1, department: 'Computer Science', studentCount: 60 },
  { id: 2, name: 'CS-B', departmentId: 1, department: 'Computer Science', studentCount: 58 },
  { id: 3, name: 'ECE-A', departmentId: 2, department: 'Electronics & Communication', studentCount: 55 },
  { id: 4, name: 'ME-A', departmentId: 3, department: 'Mechanical Engineering', studentCount: 50 },
  { id: 5, name: 'CE-A', departmentId: 4, department: 'Civil Engineering', studentCount: 45 },
];

export const mockRooms = [
  { id: 1, name: 'Room 101', capacity: 60, type: 'Classroom' },
  { id: 2, name: 'Room 102', capacity: 60, type: 'Classroom' },
  { id: 3, name: 'Room 201', capacity: 45, type: 'Classroom' },
  { id: 4, name: 'CS Lab 1', capacity: 30, type: 'Lab' },
  { id: 5, name: 'CS Lab 2', capacity: 30, type: 'Lab' },
  { id: 6, name: 'ECE Lab', capacity: 25, type: 'Lab' },
  { id: 7, name: 'Seminar Hall', capacity: 120, type: 'Classroom' },
];

export const mockWorkingDays = [
  { day: 'Monday', active: true },
  { day: 'Tuesday', active: true },
  { day: 'Wednesday', active: true },
  { day: 'Thursday', active: true },
  { day: 'Friday', active: true },
  { day: 'Saturday', active: false },
];

export const mockTimeSlots = [
  { id: 1, label: 'Period 1', start: '09:00', end: '09:50' },
  { id: 2, label: 'Period 2', start: '09:50', end: '10:40' },
  { id: 3, label: 'Period 3', start: '10:50', end: '11:40' },
  { id: 4, label: 'Period 4', start: '11:40', end: '12:30' },
  { id: 5, label: 'Lunch', start: '12:30', end: '13:20' },
  { id: 6, label: 'Period 5', start: '13:20', end: '14:10' },
  { id: 7, label: 'Period 6', start: '14:10', end: '15:00' },
  { id: 8, label: 'Period 7', start: '15:10', end: '16:00' },
];

export const mockTimetable = {
  'CS-A': {
    Monday: [
      { subject: 'Data Structures', faculty: 'Dr. Ananya Sharma', room: 'Room 101' },
      { subject: 'Database Management', faculty: 'Dr. Priya Patel', room: 'Room 101' },
      { subject: 'Calculus II', faculty: 'Dr. Meena Iyer', room: 'Room 101' },
      { subject: 'Operating Systems', faculty: 'Dr. Ananya Sharma', room: 'Room 101' },
      null,
      { subject: 'Database Management', faculty: 'Dr. Priya Patel', room: 'CS Lab 1', isLab: true },
      { subject: 'Database Management', faculty: 'Dr. Priya Patel', room: 'CS Lab 1', isLab: true },
      null,
    ],
    Tuesday: [
      { subject: 'Operating Systems', faculty: 'Dr. Ananya Sharma', room: 'Room 101' },
      { subject: 'Calculus II', faculty: 'Dr. Meena Iyer', room: 'Room 101' },
      { subject: 'Data Structures', faculty: 'Dr. Ananya Sharma', room: 'Room 101' },
      null,
      null,
      { subject: 'Operating Systems', faculty: 'Dr. Ananya Sharma', room: 'CS Lab 2', isLab: true },
      { subject: 'Operating Systems', faculty: 'Dr. Ananya Sharma', room: 'CS Lab 2', isLab: true },
      { subject: 'Data Structures', faculty: 'Dr. Ananya Sharma', room: 'Room 101' },
    ],
    Wednesday: [
      { subject: 'Database Management', faculty: 'Dr. Priya Patel', room: 'Room 101' },
      { subject: 'Data Structures', faculty: 'Dr. Ananya Sharma', room: 'Room 101' },
      null,
      { subject: 'Calculus II', faculty: 'Dr. Meena Iyer', room: 'Room 101' },
      null,
      { subject: 'Operating Systems', faculty: 'Dr. Ananya Sharma', room: 'Room 101' },
      null,
      null,
    ],
    Thursday: [
      { subject: 'Calculus II', faculty: 'Dr. Meena Iyer', room: 'Room 101' },
      { subject: 'Operating Systems', faculty: 'Dr. Ananya Sharma', room: 'Room 101' },
      { subject: 'Database Management', faculty: 'Dr. Priya Patel', room: 'Room 101' },
      { subject: 'Data Structures', faculty: 'Dr. Ananya Sharma', room: 'Room 101' },
      null,
      null,
      { subject: 'Data Structures', faculty: 'Dr. Ananya Sharma', room: 'CS Lab 1', isLab: true },
      { subject: 'Data Structures', faculty: 'Dr. Ananya Sharma', room: 'CS Lab 1', isLab: true },
    ],
    Friday: [
      { subject: 'Data Structures', faculty: 'Dr. Ananya Sharma', room: 'Room 101' },
      null,
      { subject: 'Operating Systems', faculty: 'Dr. Ananya Sharma', room: 'Room 101' },
      { subject: 'Database Management', faculty: 'Dr. Priya Patel', room: 'Room 101' },
      null,
      { subject: 'Calculus II', faculty: 'Dr. Meena Iyer', room: 'Room 101' },
      null,
      null,
    ],
  },
};

export const mockRecentActivity = [
  { id: 1, action: 'Timetable generated for CS-A', time: '2 hours ago', type: 'success' },
  { id: 2, action: 'New faculty Dr. Priya Patel added', time: '5 hours ago', type: 'info' },
  { id: 3, action: 'Room CS Lab 2 capacity updated', time: '1 day ago', type: 'info' },
  { id: 4, action: 'Section ECE-A created', time: '2 days ago', type: 'info' },
  { id: 5, action: 'Conflict detected in ME-A schedule', time: '3 days ago', type: 'warning' },
];

export const mockAnalytics = {
  facultyWorkload: [
    { name: 'Dr. Ananya S.', hours: 16, max: 18 },
    { name: 'Prof. Rajesh K.', hours: 12, max: 16 },
    { name: 'Dr. Priya P.', hours: 18, max: 20 },
    { name: 'Prof. Suresh R.', hours: 14, max: 18 },
    { name: 'Dr. Meena I.', hours: 10, max: 16 },
    { name: 'Prof. Vikram S.', hours: 8, max: 14 },
  ],
  roomUtilization: [
    { name: 'Room 101', utilization: 85 },
    { name: 'Room 102', utilization: 72 },
    { name: 'Room 201', utilization: 60 },
    { name: 'CS Lab 1', utilization: 45 },
    { name: 'CS Lab 2', utilization: 38 },
    { name: 'ECE Lab', utilization: 30 },
    { name: 'Seminar Hall', utilization: 20 },
  ],
  periodStats: { occupied: 68, free: 32 },
};
