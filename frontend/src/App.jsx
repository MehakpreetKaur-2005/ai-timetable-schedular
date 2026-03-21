import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import AuthLayout from './components/layout/AuthLayout';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Faculty from './pages/Faculty';
import Subjects from './pages/Subjects';
import Sections from './pages/Sections';
import Rooms from './pages/Rooms';
import TimeSlots from './pages/TimeSlots';
import Workload from './pages/Workload';
import GenerateTimetable from './pages/GenerateTimetable';
import ViewTimetable from './pages/ViewTimetable';
import EditTimetable from './pages/EditTimetable';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';

export default function App() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="departments" element={<Departments />} />
        <Route path="faculty" element={<Faculty />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="sections" element={<Sections />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="time-slots" element={<TimeSlots />} />
        <Route path="workload" element={<Workload />} />
        <Route path="generate" element={<GenerateTimetable />} />
        <Route path="timetable" element={<ViewTimetable />} />
        <Route path="edit-timetable" element={<EditTimetable />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Default redirect to landing instead of login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
