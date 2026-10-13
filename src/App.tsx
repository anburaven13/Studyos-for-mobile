import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ThemeProvider } from './components/ThemeProvider';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Code-splitting routes for better performance
const Login = React.lazy(() => import('./pages/Login'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Notes = React.lazy(() => import('./pages/Notes'));
const Homework = React.lazy(() => import('./pages/Homework'));
const Planner = React.lazy(() => import('./pages/Planner'));
const Tutor = React.lazy(() => import('./pages/Tutor'));
const ExamHub = React.lazy(() => import('./pages/ExamHub'));
const LastMinuteMode = React.lazy(() => import('./pages/LastMinuteMode'));
const Workspace = React.lazy(() => import('./pages/Workspace'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const Support = React.lazy(() => import('./pages/Support'));
const Routines = React.lazy(() => import('./pages/Routines'));
const Genome = React.lazy(() => import('./pages/Genome'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Messages = React.lazy(() => import('./pages/Messages'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Mobile root router: instantly sends logged-in users to /app and non-logged-in users to /login
function MobileRootRedirect() {
  const { token, loading } = useAuth();
  
  if (loading) {
    return <PageLoader />;
  }
  
  if (token) {
    return <Navigate to="/app" replace />;
  }
  
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider defaultTheme="system" storageKey="studyos-theme">
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Root and initial launch routes */}
                  <Route path="/" element={<MobileRootRedirect />} />
                  <Route path="/index.html" element={<MobileRootRedirect />} />
                  
                  {/* Auth routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  
                  {/* Info routes */}
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/support" element={<Support />} />
                  
                  {/* Protected App routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/app" element={<AppLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="notes" element={<Notes />} />
                      <Route path="homework" element={<Homework />} />
                      <Route path="planner" element={<Planner />} />
                      <Route path="tutor" element={<Tutor />} />
                      <Route path="exams" element={<ExamHub />} />
                      <Route path="exams/:examId/last-minute" element={<LastMinuteMode />} />
                      <Route path="routines" element={<Routines />} />
                      <Route path="workspace" element={<Workspace />} />
                      <Route path="messages" element={<Messages />} />
                      <Route path="genome" element={<Genome />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>
                  </Route>

                  {/* Fallback route prevents any unhandled blank white screens */}
                  <Route path="*" element={<MobileRootRedirect />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
