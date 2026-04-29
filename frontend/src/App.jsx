import React from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Students from './pages/Students';
import Lessons from './pages/Lessons';
import ReportsPage from './pages/ReportsPage';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

const App = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="layout">
      <header>
        <h1>Attendance System</h1>
        {isAuthenticated && (
          <nav>
            <NavLink to="/">Головна</NavLink>
            {(user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'student') && <NavLink to="/lessons">Заняття</NavLink>}
            <NavLink to="/reports">Звіти</NavLink>
            {user?.role === 'admin' && <NavLink to="/admin">Адмін</NavLink>}
            <NavLink to="/profile">Профіль</NavLink>
            <button className="danger" onClick={logout}>Вийти</button>
          </nav>
        )}
      </header>

      <main>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute roles={['admin']}>
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lessons"
            element={
              <ProtectedRoute roles={['admin', 'teacher', 'student']}>
                <Lessons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute roles={['admin', 'teacher', 'student']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={['admin', 'teacher', 'student']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
