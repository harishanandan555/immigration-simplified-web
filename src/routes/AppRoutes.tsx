import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../controllers/AuthControllers';
import LoginPage from '../pages/auth/LoginPage';
import FoiaCasesPage from '../pages/foia/FoiaCasesPage';
import FoiaCaseFormPage from '../pages/foia/FoiaCaseFormPage';

// Lazy-loaded components
const Dashboard = lazy(() => import('../pages/Dashboard'));
const CasesPage = lazy(() => import('../pages/cases/CasesPage'));
const CaseTrackerPage = lazy(() => import('../pages/cases/CaseTrackerPage'));
const CaseDetailsPage = lazy(() => import('../pages/cases/CaseDetailsPage'));
const CaseFormPage = lazy(() => import('../pages/cases/CaseFormPage'));
const ClientsPage = lazy(() => import('../pages/clients/ClientsPage'));
const ClientDetailsPage = lazy(() => import('../pages/clients/ClientDetailsPage'));
const ClientFormPage = lazy(() => import('../pages/clients/ClientFormPage'));
const FormsLibraryPage = lazy(() => import('../pages/forms/FormsLibraryPage'));
const FormFillPage = lazy(() => import('../pages/forms/FormFillPage'));
const DocumentsPage = lazy(() => import('../pages/documents/DocumentsPage'));
const TasksPage = lazy(() => import('../pages/tasks/TasksPage'));
const CalendarPage = lazy(() => import('../pages/tasks/CalendarPage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />

      {/* Protected routes */}
      {user ? (
        <Route element={<Layout />}>
          <Route path="/" element={
            <Suspense fallback={<LoadingSpinner />}>
              <Dashboard />
            </Suspense>
          } />

          <Route path="/cases" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CasesPage />
            </Suspense>
          } />

          <Route path="/cases/tracker" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CaseTrackerPage />
            </Suspense>
          } />

          <Route path="/case/:caseNumber" element={<CaseTrackerPage />} />

          <Route path="/cases/new" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CaseFormPage />
            </Suspense>
          } />

          <Route path="/cases/:id" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CaseDetailsPage />
            </Suspense>
          } />

          <Route path="/cases/:id/edit" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CaseFormPage />
            </Suspense>
          } />

          <Route path="/clients" element={
            <Suspense fallback={<LoadingSpinner />}>
              <ClientsPage />
            </Suspense>
          } />

          <Route path="/clients/new" element={
            <Suspense fallback={<LoadingSpinner />}>
              <ClientFormPage />
            </Suspense>
          } />

          <Route path="/clients/:id" element={
            <Suspense fallback={<LoadingSpinner />}>
              <ClientDetailsPage />
            </Suspense>
          } />

          <Route path="/clients/:id/edit" element={
            <Suspense fallback={<LoadingSpinner />}>
              <ClientFormPage />
            </Suspense>
          } />

          <Route path="/forms" element={
            <Suspense fallback={<LoadingSpinner />}>
              <FormsLibraryPage />
            </Suspense>
          } />

          <Route path="/forms/:id" element={
            <Suspense fallback={<LoadingSpinner />}>
              <FormFillPage />
            </Suspense>
          } />

          <Route path="/documents" element={
            <Suspense fallback={<LoadingSpinner />}>
              <DocumentsPage />
            </Suspense>
          } />

          <Route path="/tasks" element={
            <Suspense fallback={<LoadingSpinner />}>
              <TasksPage />
            </Suspense>
          } />

          <Route path="/calendar" element={
            <Suspense fallback={<LoadingSpinner />}>
              <CalendarPage />
            </Suspense>
          } />

          <Route path="/settings" element={
            <Suspense fallback={<LoadingSpinner />}>
              <SettingsPage />
            </Suspense>
          } />

          <Route path="/foia-cases" element={<FoiaCasesPage />} />
          <Route path="/foia-cases/new" element={<FoiaCaseFormPage />} />

          <Route path="*" element={
            <Suspense fallback={<LoadingSpinner />}>
              <NotFoundPage />
            </Suspense>
          } />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
};

export default AppRoutes;