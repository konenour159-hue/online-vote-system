import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from './store/themeStore';
import { PrivateRoute } from './components/PrivateRoute';
import { RouteEffects } from './components/RouteEffects';
import { LandingPage } from './pages/LandingPage';

// Chargement à la demande : chaque page n'est téléchargée que lorsqu'on y va.
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ElectionPage = lazy(() => import('./pages/ElectionPage').then((m) => ({ default: m.ElectionPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const CandidatesAdminPage = lazy(() =>
  import('./pages/CandidatesAdminPage').then((m) => ({ default: m.CandidatesAdminPage }))
);
const CandidacyPage = lazy(() => import('./pages/CandidacyPage').then((m) => ({ default: m.CandidacyPage })));
const ActivityPage = lazy(() => import('./pages/ActivityPage').then((m) => ({ default: m.ActivityPage })));
const AdminDashboardPage = lazy(() =>
  import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
import './styles/globals.css';

function App() {
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <BrowserRouter>
      <RouteEffects />
      <Suspense fallback={<p role="status" className="p-8 text-muted">Chargement…</p>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route path="/elections/:id" element={<PrivateRoute><ElectionPage /></PrivateRoute>} />
        <Route path="/results/:id" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />
        <Route path="/admin/candidates" element={<PrivateRoute><CandidatesAdminPage /></PrivateRoute>} />
        <Route path="/candidacy" element={<PrivateRoute><CandidacyPage /></PrivateRoute>} />
        <Route path="/admin/activity" element={<PrivateRoute><ActivityPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
