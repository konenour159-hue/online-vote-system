import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from './store/themeStore';
import { PrivateRoute } from './components/PrivateRoute';
import { RouteEffects } from './components/RouteEffects';
import { PwaStatus } from './components/PwaStatus';
import { LandingPage } from './pages/LandingPage';

// Chargement à la demande : chaque page n'est téléchargée que lorsqu'on y va.
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const VoteFormPage = lazy(() => import('./pages/VoteFormPage').then((m) => ({ default: m.VoteFormPage })));
const VoteDetailPage = lazy(() => import('./pages/VoteDetailPage').then((m) => ({ default: m.VoteDetailPage })));
const VotePage = lazy(() => import('./pages/VotePage').then((m) => ({ default: m.VotePage })));
const CandidatePage = lazy(() => import('./pages/CandidatePage').then((m) => ({ default: m.CandidatePage })));
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
      <PwaStatus />
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
        <Route path="/admin" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />
        <Route path="/admin/votes/new" element={<PrivateRoute><VoteFormPage /></PrivateRoute>} />
        <Route path="/admin/votes/:id" element={<PrivateRoute><VoteDetailPage /></PrivateRoute>} />
        <Route path="/v/:token" element={<VotePage />} />
        <Route path="/c/:token" element={<CandidatePage />} />
        <Route path="/admin/activity" element={<PrivateRoute><ActivityPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
