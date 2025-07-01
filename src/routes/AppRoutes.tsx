import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../controllers/AuthControllers';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import FoiaCasesPage from '../pages/foia/FoiaCasesPage';
import FoiaCaseFormPage from '../pages/foia/FoiaCaseFormPage';
import FoiaCasesDetailsPage from '../pages/foia/FoiaCasesDetailsPage';

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
const ImmigrationProcess = lazy(() => import('../pages/immigrationSteps/ImmigrationProcess'));
const IndividualImmigrationProcess = lazy(() => import('../pages/immigrationSteps/IndividualImmigrationProcess'));
const EnhancedIndividualFormFiling = lazy(() => import('../pages/EnhancedIndividualFormFiling'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const AppRoutes = () => {
  
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Routes>
      <Route path="/" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />

      {/* Protected routes */}
      {user ? (
        <Route element={<Layout />}>
          <Route path="/dashboard" element={
            <Suspense fallback={null}>
              <Dashboard />
            </Suspense>
          } />

          <Route path="/immigration-process" element={
            <Suspense fallback={null}>
              <ImmigrationProcess />
            </Suspense>
          } />

          <Route path="/immigration-process/individual" element={
            <Suspense fallback={null}>
              <IndividualImmigrationProcess />
            </Suspense>
          } />

          <Route path="/enhanced-individual-filing" element={
            <Suspense fallback={null}>
              <EnhancedIndividualFormFiling />
            </Suspense>
          } />

          {/* Additional immigration workflow routes */}
          <Route path="/immigration-process/legal-firm" element={
            <Suspense fallback={null}>
              <ImmigrationProcess />
            </Suspense>
          } />

          <Route path="/forms/i-130" element={
            <Suspense fallback={null}>
              <EnhancedIndividualFormFiling />
            </Suspense>
          } />

          <Route path="/forms/enhanced-filing" element={
            <Suspense fallback={null}>
              <EnhancedIndividualFormFiling />
            </Suspense>
          } />

          <Route path="/immigration" element={
            <Navigate to="/immigration-process" replace />
          } />

          <Route path="/individual-filing" element={
            <Navigate to="/enhanced-individual-filing" replace />
          } />

          {/* Cases routes */}
          <Route path="/cases" element={
            <Suspense fallback={null}>
              <CasesPage />
            </Suspense>
          } />
          <Route path="/cases/tracker" element={
            <Suspense fallback={null}>
              <CaseTrackerPage />
            </Suspense>
          } />
          <Route path="/case/:caseNumber" element={
            <Suspense fallback={null}>
              <CaseTrackerPage />
            </Suspense>
          } />
          <Route path="/cases/new" element={
            <Suspense fallback={null}>
              <CaseFormPage />
            </Suspense>
          } />
          <Route path="/cases/:id" element={
            <Suspense fallback={null}>
              <CaseDetailsPage />
            </Suspense>
          } />
          <Route path="/cases/:id/edit" element={
            <Suspense fallback={null}>
              <CaseFormPage />
            </Suspense>
          } />

          {/* Clients routes */}
          <Route path="/clients" element={
            <Suspense fallback={null}>
              <ClientsPage />
            </Suspense>
          } />
          <Route path="/clients/new" element={
            <Suspense fallback={null}>
              <ClientFormPage />
            </Suspense>
          } />
          <Route path="/clients/:id" element={
            <Suspense fallback={null}>
              <ClientDetailsPage />
            </Suspense>
          } />
          <Route path="/clients/:id/edit" element={
            <Suspense fallback={null}>
              <ClientFormPage />
            </Suspense>
          } />

          {/* Forms routes */}
          <Route path="/forms" element={
            <Suspense fallback={null}>
              <FormsLibraryPage />
            </Suspense>
          } />
          <Route path="/forms/:id" element={
            <Suspense fallback={null}>
              <FormFillPage />
            </Suspense>
          } />

          {/* Documents route */}
          <Route path="/documents" element={
            <Suspense fallback={null}>
              <DocumentsPage />
            </Suspense>
          } />

          {/* Tasks and Calendar routes */}
          <Route path="/tasks" element={
            <Suspense fallback={null}>
              <TasksPage />
            </Suspense>
          } />
          <Route path="/calendar" element={
            <Suspense fallback={null}>
              <CalendarPage />
            </Suspense>
          } />

          {/* Settings route */}
          <Route path="/settings" element={
            <Suspense fallback={null}>
              <SettingsPage />
            </Suspense>
          } />

          {/* FOIA routes */}
          <Route path="/foia-cases" element={<FoiaCasesPage />} />
          <Route path="/foia-cases/new" element={<FoiaCaseFormPage />} />
          <Route path="/foia-cases/:caseId" element={<FoiaCasesDetailsPage />} />

          {/* Catch-all route */}
          <Route path="*" element={
            <Suspense fallback={null}>
              <NotFoundPage />
            </Suspense>
          } />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
    </Routes>
  );
};

export default AppRoutes;