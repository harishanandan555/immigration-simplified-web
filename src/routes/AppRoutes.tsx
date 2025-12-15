import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../controllers/AuthControllers';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import FoiaCasesPage from '../pages/foia/FoiaCasesPage';
import FoiaCaseFormPage from '../pages/foia/FoiaCaseFormPage';
import FoiaCaseDetailsPage from '../pages/foia/FoiaCaseDetailsPage';

// Lazy-loaded components
const Dashboard = lazy(() => import('../pages/Dashboard'));
const CasesPage = lazy(() => import('../pages/cases/CasesPage'));
const CaseTrackerPage = lazy(() => import('../pages/foia/FoiaCaseTrackerPage'));
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
const IndividualImmigrationProcess = lazy(() => import('../pages/immigrationSteps/IndividualImmigrationProcess'));
const EnhancedIndividualFormFiling = lazy(() => import('../pages/EnhancedIndividualFormFiling'));
const LegalFirmWorkflow = lazy(() => import('../pages/LegalFirmWorkflow'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const MyQuestionnaires = lazy(() => import('../pages/MyQuestionnaires'));
const FillQuestionnaire = lazy(() => import('../pages/FillQuestionnaire'));
const QuestionnaireResponses = lazy(() => import('../pages/QuestionnaireResponses'));
const ResponseView = lazy(() => import('../pages/ResponseView'));
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'));
const IndividualClientsPage = lazy(() => import('../pages/admin/IndividualClientsPage'));
const CompaniesPage = lazy(() => import('../pages/admin/CompaniesPage'));

const AppRoutes = () => {
  
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Routes>
      <Route path="/" element={!user ? <LoginPage /> : <Navigate to={user.role === 'client' ? '/my-questionnaires' : '/dashboard'} replace />} />
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user.role === 'client' ? '/my-questionnaires' : '/dashboard'} replace />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to={user.role === 'client' ? '/my-questionnaires' : '/dashboard'} replace />} />

      {/* Protected routes */}
      {user ? (
        <Route element={<Layout />}>
          <Route path="/dashboard" element={
            <Suspense fallback={null}>
              <Dashboard />
            </Suspense>
          } />

          <Route path="/immigration-process" element={
            <Navigate to="/immigration-process/individual" replace />
          } />

          <Route path="/immigration-process/individual" element={
            (user?.role === 'client' && user?.userType === 'individualUser') ? (
              <Suspense fallback={null}>
                <IndividualImmigrationProcess />
              </Suspense>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } />

          <Route path="/enhanced-individual-filing" element={
            <Suspense fallback={null}>
              <EnhancedIndividualFormFiling />
            </Suspense>
          } />

          <Route path="/legal-firm-workflow" element={
            <Suspense fallback={null}>
              {/* Attorneys only route */}
              <LegalFirmWorkflow />
            </Suspense>
          } />

          {/* Additional immigration workflow routes */}
          <Route path="/immigration-process/legal-firm" element={
            <Suspense fallback={null}>
              <LegalFirmWorkflow />
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

          {/* Questionnaires routes */}
          <Route path="/my-questionnaires" element={
            (user?.role === 'client' && user?.userType === 'companyClient') ? (
              <Suspense fallback={null}>
                <MyQuestionnaires />
              </Suspense>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } />
          <Route path="/questionnaires/fill/:id" element={
            <Suspense fallback={null}>
              <FillQuestionnaire />
            </Suspense>
          } />
          <Route path="/questionnaires/responses" element={
            <Suspense fallback={null}>
              <QuestionnaireResponses />
            </Suspense>
          } />
          <Route path="/questionnaires/response/:id" element={
            <Suspense fallback={null}>
              <ResponseView />
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
            (user?.role === 'superadmin' || user?.role === 'attorney' || user?.role === 'paralegal') ? (
              <Suspense fallback={null}>
                <TasksPage />
              </Suspense>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } />
          <Route path="/calendar" element={
            (user?.role === 'superadmin' || user?.role === 'attorney' || user?.role === 'paralegal') ? (
              <Suspense fallback={null}>
                <CalendarPage />
              </Suspense>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } />

          {/* Settings route */}
          <Route path="/settings" element={
            <Suspense fallback={null}>
              <SettingsPage />
            </Suspense>
          } />

          {/* Reports route */}
          <Route path="/reports" element={
            <Suspense fallback={null}>
              <ReportsPage />
            </Suspense>
          } />

          {/* Superadmin Management routes */}
          <Route path="/admin/individual-clients" element={
            (user?.role === 'superadmin') ? (
              <Suspense fallback={null}>
                <IndividualClientsPage />
              </Suspense>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } />
          <Route path="/admin/companies" element={
            (user?.role === 'superadmin') ? (
              <Suspense fallback={null}>
                <CompaniesPage />
              </Suspense>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } />

          {/* FOIA routes */}
          <Route path="/foia-cases" element={<FoiaCasesPage />} />
          <Route path="/foia-cases/new" element={<FoiaCaseFormPage />} />
          <Route path="/foia-cases/:id" element={<FoiaCaseDetailsPage />} />
          <Route path="/foia-cases/:id/edit" element={<FoiaCaseFormPage />} />
          <Route path="/foia-tracker" element={<CaseTrackerPage />} />
          <Route path="/foia-tracker/:requestNumber" element={<CaseTrackerPage />} />

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