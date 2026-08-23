import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { Loading } from './components/ui.jsx';
import StudentPortal from './pages/StudentPortal.jsx';
import FacultyUpload from './pages/FacultyUpload.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import SuperDashboard from './pages/super/Dashboard.jsx';
import Colleges from './pages/super/Colleges.jsx';
import CollegeDashboard from './pages/college/Dashboard.jsx';
import Courses from './pages/college/Courses.jsx';
import Sections from './pages/college/Sections.jsx';
import Students from './pages/college/Students.jsx';
import Upload from './pages/college/Upload.jsx';
import Results from './pages/college/Results.jsx';
import Settings from './pages/college/Settings.jsx';

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'super_admin' ? '/admin' : '/college'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<StudentPortal />} />
        <Route path="/faculty-upload" element={<FacultyUpload />} />
        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={<Protected role="super_admin"><SuperDashboard /></Protected>} />
        <Route path="/admin/colleges" element={<Protected role="super_admin"><Colleges /></Protected>} />

        <Route path="/college" element={<Protected role="college_admin"><CollegeDashboard /></Protected>} />
        <Route path="/college/courses" element={<Protected role="college_admin"><Courses /></Protected>} />
        <Route path="/college/sections" element={<Protected role="college_admin"><Sections /></Protected>} />
        <Route path="/college/students" element={<Protected role="college_admin"><Students /></Protected>} />
        <Route path="/college/upload" element={<Protected role="college_admin"><Upload /></Protected>} />
        <Route path="/college/results" element={<Protected role="college_admin"><Results /></Protected>} />
        <Route path="/college/settings" element={<Protected role="college_admin"><Settings /></Protected>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
