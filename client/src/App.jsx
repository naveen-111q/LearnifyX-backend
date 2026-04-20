import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import { GraduationCap } from 'lucide-react';
import { NotificationProvider } from './context/NotificationContext';
import NotificationContainer from './components/Common/NotificationContainer';


const Navbar = () => {
  // const location = useLocation();
  // const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  // const isLoggedIn = !!localStorage.getItem('token');

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <GraduationCap size={28} />
          LearnifyX
        </Link>

      </div>
    </nav>
  );
};

const Footer = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/student') || location.pathname.startsWith('/teacher') || location.pathname.startsWith('/admin');

  if (isDashboard) return null;

  return (
    <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
      <p>&copy; 2026 LearnifyX. All rights reserved.</p>
    </footer>
  );
};

const ThemeController = () => {
  const location = useLocation();

  React.useEffect(() => {
    const isPublicPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';

    if (isPublicPage) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      // Use user-ID-specific theme keys so each student/teacher has their own theme
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const themeKey = user.role === 'teacher'
        ? `theme_teacher_${user.id || 'default'}`
        : `theme_student_${user.id || 'default'}`;
      const savedTheme = localStorage.getItem(themeKey) || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, [location.pathname]);

  return null;
};

const App = () => {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <ThemeController />
        <NotificationContainer />
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin-login" element={<AdminLogin />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </NotificationProvider>
  );
};

export default App;
