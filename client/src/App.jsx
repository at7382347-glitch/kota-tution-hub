import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';

// Every page except Home is split into its own chunk and downloaded only when visited,
// so the Home page (most visitors, mostly on mobile) stays small.
const FeeStructure = lazy(() => import('./pages/FeeStructure'));
const Login = lazy(() => import('./pages/Login'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const TeacherProfile = lazy(() => import('./pages/TeacherProfile'));
const BrowseTeachers = lazy(() => import('./pages/BrowseTeachers'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-sandstone">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-marigold border-t-transparent" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fee-structure" element={<FeeStructure />} />
          <Route path="/login" element={<Login />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/:id" element={<ProtectedRoute><TeacherProfile /></ProtectedRoute>} />
          <Route path="/browse-teachers" element={<ProtectedRoute><BrowseTeachers /></ProtectedRoute>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
