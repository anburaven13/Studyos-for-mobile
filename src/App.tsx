import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './lib/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Code-splitting routes for better performance (LCP/Initial Load)
const Login = React.lazy(() => import('./pages/Login'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Notes = React.lazy(() => import('./pages/Notes'));
const Homework = React.lazy(() => import('./pages/Homework'));
const Planner = React.lazy(() => import('./pages/Planner'));
const Tutor = React.lazy(() => import('./pages/Tutor'));
const ExamHub = React.lazy(() => import('./pages/ExamHub'));
const Workspace = React.lazy(() => import('./pages/Workspace'));
const Landing = React.lazy(() => import('./pages/Landing'));
const Routines = React.lazy(() => import('./pages/Routines'));
const Genome = React.lazy(() => import('./pages/Genome'));
const Settings = React.lazy(() => import('./pages/Settings'));

// A simple loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/onboarding" element={<Onboarding />} />
              
              <Route path="/" element={<Landing />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="notes" element={<Notes />} />
                  <Route path="homework" element={<Homework />} />
                  <Route path="planner" element={<Planner />} />
                  <Route path="tutor" element={<Tutor />} />
                  <Route path="exams" element={<ExamHub />} />
                  <Route path="routines" element={<Routines />} />
                  <Route path="workspace" element={<Workspace />} />
                  <Route path="genome" element={<Genome />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
