import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import CourseQuiz from './pages/CourseQuiz';
import BookDetail from './pages/BookDetail';
import Library from './pages/Library';
import Login from './pages/Login';
import { useAuth } from './modules/auth';
import { setOnAuthFailure } from './modules/http';
import { resolveExpiryMs } from './modules/auth/tokenStorage';

const Classroom = lazy(() => import('./pages/Classroom'));
const Live = lazy(() => import('./pages/Live'));
const Jobs = lazy(() => import('./pages/Jobs'));
const LiveJoin = lazy(() => import('./pages/LiveJoin'));

const RouteLoading = ({ label }) => (
  <div className="min-h-[70vh] bg-blue-50 flex items-center justify-center px-6">
    <div className="w-full max-w-md rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm">
      <div className="inline-flex items-center rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-blue-900">
        Loading {label}...
      </div>
      <div className="mt-4 text-2xl font-bold text-blue-900">Getting things ready</div>
      <p className="mt-2 text-blue-700">
        This page loads on demand to keep the dashboard fast.
      </p>
      <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-blue-100">
        <div className="h-full w-1/2 rounded-full bg-blue-600 animate-pulse"></div>
      </div>
    </div>
  </div>
);

const RequireAuth = () => {
  const { isAuthed } = useAuth();

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const PublicOnlyRoute = () => {
  const { isAuthed } = useAuth();

  if (isAuthed) {
    return <Navigate to="/" replace />;
  }

  return <Login />;
};

const SessionWatcher = () => {
  const navigate = useNavigate();
  const { tokens, api } = useAuth();

  useEffect(() => {
    setOnAuthFailure(() => {
      api.logout();
      navigate('/login', { replace: true });
    });

    return () => {
      setOnAuthFailure(null);
    };
  }, [api, navigate]);

  useEffect(() => {
    const refreshExpiresAt = tokens?.refreshTokenExpiresAt;
    const refreshExpiryMs = resolveExpiryMs(refreshExpiresAt);

    if (!tokens?.refreshToken || !refreshExpiryMs) {
      return undefined;
    }

    const msUntilRefreshExpiry = refreshExpiryMs - Date.now();

    if (msUntilRefreshExpiry <= 0) {
      api.logout();
      navigate('/login', { replace: true });
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      api.logout();
      navigate('/login', { replace: true });
    }, msUntilRefreshExpiry);

    return () => clearTimeout(timeoutId);
  }, [api, navigate, tokens?.refreshToken, tokens?.refreshTokenExpiresAt]);

  return <Outlet />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute />} />

        {/* Public share link — no auth required */}
        <Route
          path="/live/s/:slug"
          element={
            <Suspense fallback={<RouteLoading label="Live" />}>
              <LiveJoin />
            </Suspense>
          }
        />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route element={<SessionWatcher />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:courseId" element={<CourseDetail />} />
              <Route path="/courses/:courseId/quiz" element={<CourseQuiz />} />
              <Route path="/library/:bookId" element={<BookDetail />} />
              <Route
                path="/classroom"
                element={
                  <Suspense fallback={<RouteLoading label="Classroom" />}>
                    <Classroom />
                  </Suspense>
                }
              />
              <Route path="/library" element={<Library />} />
              <Route
                path="/jobs"
                element={
                  <Suspense fallback={<RouteLoading label="Jobs" />}>
                    <Jobs />
                  </Suspense>
                }
              />
              <Route
                path="/live"
                element={
                  <Suspense fallback={<RouteLoading label="Live" />}>
                    <Live />
                  </Suspense>
                }
              />
              <Route
                path="/live/:roomId"
                element={
                  <Suspense fallback={<RouteLoading label="Live" />}>
                    <Live />
                  </Suspense>
                }
              />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
