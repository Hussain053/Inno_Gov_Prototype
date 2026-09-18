import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout & RBAC
import { AppLayout } from './components/layout/AppLayout';
import { RoleGate } from './components/common/RoleGate';

// Public Pages
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';

// Common Authenticated Pages
import { NotificationsPage } from './pages/common/NotificationsPage';

// Startup Pages
import { StartupDashboard } from './pages/startup/StartupDashboard';
import { StartupProfilePage } from './pages/startup/StartupProfilePage';
import { StartupChallengesPage } from './pages/startup/StartupChallengesPage';
import { StartupChallengeDetailPage } from './pages/startup/StartupChallengeDetailPage';
import { StartupApplicationsPage } from './pages/startup/StartupApplicationsPage';
import { StartupPilotsPage } from './pages/startup/StartupPilotsPage';
import { StartupPilotDetailPage } from './pages/startup/StartupPilotDetailPage';
import { StartupPilotSubmitPage } from './pages/startup/StartupPilotSubmitPage';
import { StartupSubmissionsPage } from './pages/startup/StartupSubmissionsPage';
import { StartupPaymentsPage } from './pages/startup/StartupPaymentsPage';

// Government Pages
import { GovernmentDashboard } from './pages/government/GovernmentDashboard';
import { GovernmentChallengesListPage } from './pages/government/GovernmentChallengesListPage';
import { GovernmentCreateChallengePage } from './pages/government/GovernmentCreateChallengePage';
import { GovernmentChallengeDetailPage } from './pages/government/GovernmentChallengeDetailPage';
import { GovernmentMatchingPage } from './pages/government/GovernmentMatchingPage';
import { GovernmentApplicationsReviewPage } from './pages/government/GovernmentApplicationsReviewPage';
import { GovernmentCreatePilotPage } from './pages/government/GovernmentCreatePilotPage';
import { GovernmentPilotsPage } from './pages/government/GovernmentPilotsPage';
import { GovernmentPilotDetailPage } from './pages/government/GovernmentPilotDetailPage';
import { GovernmentEvaluationsPage } from './pages/government/GovernmentEvaluationsPage';
import { GovernmentContractsPage } from './pages/government/GovernmentContractsPage';

// Evaluator Pages
import { EvaluatorDashboard } from './pages/evaluator/EvaluatorDashboard';
import { EvaluatorAssignmentsPage } from './pages/evaluator/EvaluatorAssignmentsPage';
import { EvaluatorWorkspacePage } from './pages/evaluator/EvaluatorWorkspacePage';
import { EvaluatorHistoryPage } from './pages/evaluator/EvaluatorHistoryPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminVerificationPage } from './pages/admin/AdminVerificationPage';
import { AdminActivityPage } from './pages/admin/AdminActivityPage';

export const App: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Initializing InnoGov session...</p>
        </div>
      </div>
    );
  }

  // Helper to redirect authenticated root to their portal
  const getDefaultPortal = () => {
    if (!isAuthenticated() || !user) return '/login';
    switch (user.role) {
      case 'STARTUP':
        return '/startup';
      case 'GOVERNMENT':
        return '/government';
      case 'EVALUATOR':
        return '/evaluator';
      case 'ADMIN':
        return '/admin';
      default:
        return '/login';
    }
  };

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={isAuthenticated() ? <Navigate to={getDefaultPortal()} replace /> : <LoginPage />}
      />

      {/* Authenticated Application Layout */}
      <Route element={<AppLayout />}>
        {/* Common Notifications (all roles and role-specific aliases) */}
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/startup/notifications" element={<RoleGate allowedRoles={['STARTUP']}><NotificationsPage /></RoleGate>} />
        <Route path="/government/notifications" element={<RoleGate allowedRoles={['GOVERNMENT']}><NotificationsPage /></RoleGate>} />
        <Route path="/evaluator/notifications" element={<RoleGate allowedRoles={['EVALUATOR']}><NotificationsPage /></RoleGate>} />
        <Route path="/admin/notifications" element={<RoleGate allowedRoles={['ADMIN']}><NotificationsPage /></RoleGate>} />

        {/* Startup Portal */}
        <Route
          path="/startup"
          element={
            <RoleGate allowedRoles={['STARTUP']}>
              <StartupDashboard />
            </RoleGate>
          }
        />
        <Route
          path="/startup/profile"
          element={
            <RoleGate allowedRoles={['STARTUP']}>
              <StartupProfilePage />
            </RoleGate>
          }
        />
        <Route
          path="/startup/challenges"
          element={
            <RoleGate allowedRoles={['STARTUP']}>
              <StartupChallengesPage />
            </RoleGate>
          }
        />
        <Route
          path="/startup/challenges/:id"
          element={
            <RoleGate allowedRoles={['STARTUP']}>
              <StartupChallengeDetailPage />
            </RoleGate>
          }
        />
        <Route
          path="/startup/applications"
          element={
            <RoleGate allowedRoles={['STARTUP']}>
              <StartupApplicationsPage />
            </RoleGate>
          }
        />
        <Route
          path="/startup/pilots"
          element={
            <RoleGate allowedRoles={['STARTUP']}>
              <StartupPilotsPage />
            </RoleGate>
          }
        />
        <Route
          path="/startup/pilots/:id"
          element={
            <RoleGate allowedRoles={['STARTUP']}>
              <StartupPilotDetailPage />
            </RoleGate>
          }
        />
        <Route
          path="/startup/pilots/:id/submit"
          element={
            <RoleGate allowedRoles={['STARTUP']}>
              <StartupPilotSubmitPage />
            </RoleGate>
          }
        />
        <Route
          path="/startup/submissions"
          element={
            <RoleGate allowedRoles={['STARTUP']}>
              <StartupSubmissionsPage />
            </RoleGate>
          }
        />
        <Route
          path="/startup/payments"
          element={
            <RoleGate allowedRoles={['STARTUP']}>
              <StartupPaymentsPage />
            </RoleGate>
          }
        />

        {/* Government Portal */}
        <Route
          path="/government"
          element={
            <RoleGate allowedRoles={['GOVERNMENT']}>
              <GovernmentDashboard />
            </RoleGate>
          }
        />
        <Route
          path="/government/challenges"
          element={
            <RoleGate allowedRoles={['GOVERNMENT']}>
              <GovernmentChallengesListPage />
            </RoleGate>
          }
        />
        <Route
          path="/government/challenges/create"
          element={
            <RoleGate allowedRoles={['GOVERNMENT']}>
              <GovernmentCreateChallengePage />
            </RoleGate>
          }
        />
        <Route
          path="/government/challenges/:id"
          element={
            <RoleGate allowedRoles={['GOVERNMENT']}>
              <GovernmentChallengeDetailPage />
            </RoleGate>
          }
        />
        <Route
          path="/government/challenges/:id/matching"
          element={
            <RoleGate allowedRoles={['GOVERNMENT']}>
              <GovernmentMatchingPage />
            </RoleGate>
          }
        />
        <Route
          path="/government/matching/:id"
          element={
            <RoleGate allowedRoles={['GOVERNMENT']}>
              <GovernmentMatchingPage />
            </RoleGate>
          }
        />
        <Route
          path="/government/challenges/:id/applications"
          element={
            <RoleGate allowedRoles={['GOVERNMENT']}>
              <GovernmentApplicationsReviewPage />
            </RoleGate>
          }
        />
        <Route
          path="/government/applications"
          element={
            <RoleGate allowedRoles={['GOVERNMENT']}>
              <GovernmentApplicationsReviewPage />
            </RoleGate>
          }
        />
        <Route
          path="/government/pilots/create"
          element={
            <RoleGate allowedRoles={['GOVERNMENT']}>
              <GovernmentCreatePilotPage />
            </RoleGate>
          }
        />
        <Route
          path="/government/pilots"
          element={
            <RoleGate allowedRoles={['GOVERNMENT']}>
              <GovernmentPilotsPage />
            </RoleGate>
          }
        />
        <Route
          path="/government/pilots/:id"
          element={
            <RoleGate allowedRoles={['GOVERNMENT']}>
              <GovernmentPilotDetailPage />
            </RoleGate>
          }
        />
        <Route
          path="/government/evaluations"
          element={
            <RoleGate allowedRoles={['GOVERNMENT']}>
              <GovernmentEvaluationsPage />
            </RoleGate>
          }
        />
        <Route
          path="/government/contracts"
          element={
            <RoleGate allowedRoles={['GOVERNMENT']}>
              <GovernmentContractsPage />
            </RoleGate>
          }
        />

        {/* Evaluator Portal */}
        <Route
          path="/evaluator"
          element={
            <RoleGate allowedRoles={['EVALUATOR']}>
              <EvaluatorDashboard />
            </RoleGate>
          }
        />
        <Route
          path="/evaluator/assignments"
          element={
            <RoleGate allowedRoles={['EVALUATOR']}>
              <EvaluatorAssignmentsPage />
            </RoleGate>
          }
        />
        <Route
          path="/evaluator/workspace/:id"
          element={
            <RoleGate allowedRoles={['EVALUATOR']}>
              <EvaluatorWorkspacePage />
            </RoleGate>
          }
        />
        <Route
          path="/evaluator/evaluate/:id"
          element={
            <RoleGate allowedRoles={['EVALUATOR']}>
              <EvaluatorWorkspacePage />
            </RoleGate>
          }
        />
        <Route
          path="/evaluator/history"
          element={
            <RoleGate allowedRoles={['EVALUATOR']}>
              <EvaluatorHistoryPage />
            </RoleGate>
          }
        />

        {/* Admin Portal */}
        <Route
          path="/admin"
          element={
            <RoleGate allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </RoleGate>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleGate allowedRoles={['ADMIN']}>
              <AdminUsersPage />
            </RoleGate>
          }
        />
        <Route
          path="/admin/verification"
          element={
            <RoleGate allowedRoles={['ADMIN']}>
              <AdminVerificationPage />
            </RoleGate>
          }
        />
        <Route
          path="/admin/verifications"
          element={
            <RoleGate allowedRoles={['ADMIN']}>
              <AdminVerificationPage />
            </RoleGate>
          }
        />
        <Route
          path="/admin/activity"
          element={
            <RoleGate allowedRoles={['ADMIN']}>
              <AdminActivityPage />
            </RoleGate>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={getDefaultPortal()} replace />} />
    </Routes>
  );
};

export default App;
