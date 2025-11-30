
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { LearningHubProvider } from '@/contexts/LearningHubContext';
import { useAppVersion } from '@/hooks/useAppVersion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AuthRedirect from '@/components/routing/AuthRedirect';
import { OnboardingGuard } from '@/components/routing/OnboardingGuard';
import { HubAccessGuard } from '@/components/routing/HubAccessGuard';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import InteractiveSignup from './pages/InteractiveSignup';
import Auth from './pages/Auth';
import LearningHub from './pages/LearningHub';
import LearningHubLayout from './components/learningHub/LearningHubLayout';
import LearningHubDashboard from './pages/LearningHubDashboard';
import LearningHubCleo from './pages/LearningHubCleo';
import LearningHubMyCourses from './pages/LearningHubMyCourses';
import LearningHubSettings from './pages/LearningHubSettings';
import SubscriptionManagement from './pages/SubscriptionManagement';
import LearningHubRevision from './pages/LearningHubRevision';
import LearningHubAssessments from './pages/LearningHubAssessments';
import LearningHubCleoID from './pages/LearningHubCleoID';
import CourseDetail from './pages/CourseDetail';
import ModuleDetail from './pages/ModuleDetail';
import LessonPlanning from './pages/LessonPlanning';
import Settings from './pages/Settings';
import OnboardingWizard from './pages/OnboardingWizard';
import PricingPage from './pages/PricingPage';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import ComingSoon from './pages/ComingSoon';

// Admin pages (for Cleo tracking)
import HubAccessManagement from './pages/admin/HubAccessManagement';
import CleoTracker from './pages/admin/CleoTracker';
import CleoUserDetail from './pages/admin/CleoUserDetail';

// Component to monitor app version
const AppVersionMonitor = () => {
  useAppVersion();
  return null;
};

function App() {
  const queryClient = new QueryClient();

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AppVersionMonitor />
        <AuthProvider>
            <OrganizationProvider>
              <LearningHubProvider>
              <Routes>
                {/* Root route with auth redirect */}
                <Route path="/" element={<AuthRedirect />} />
                
                {/* Public routes */}
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/interactive-signup" element={<InteractiveSignup />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/coming-soon" element={<ComingSoon />} />
                
                {/* Onboarding wizard route */}
                <Route 
                  path="/onboarding" 
                  element={
                    <ProtectedRoute>
                      <OnboardingWizard />
                    </ProtectedRoute>
                  } 
                />

                {/* Settings route */}
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Admin routes for Cleo tracking */}
                <Route 
                  path="/admin/cleo-tracker" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'owner']}>
                      <CleoTracker />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/cleo-tracker/:userId" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'owner']}>
                      <CleoUserDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/hub-access" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'owner']}>
                      <HubAccessManagement />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Learning Hub Routes */}
                <Route
                  path="/heycleo"
                  element={
                    <ProtectedRoute>
                      <OnboardingGuard>
                        <HubAccessGuard>
                          <LearningHubLayout />
                        </HubAccessGuard>
                      </OnboardingGuard>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<LearningHubDashboard />} />
                  <Route path="my-courses" element={<LearningHubMyCourses />} />
                  <Route path="revision" element={<LearningHubRevision />} />
                  <Route path="assessments" element={<LearningHubAssessments />} />
                  <Route path="my-cleo-id" element={<LearningHubCleoID />} />
                  <Route path="cleo" element={<LearningHubCleo />} />
                  <Route path="settings" element={<LearningHubSettings />} />
                  <Route path="subscription" element={<SubscriptionManagement />} />
                  <Route path="course/:id" element={<CourseDetail />} />
                  <Route path="course/:courseId/module/:moduleId" element={<ModuleDetail />} />
                  <Route path="lesson/:lessonId" element={<LessonPlanning />} />
                </Route>

                {/* Legacy learning-hub redirect */}
                <Route path="/learning-hub/*" element={<Navigate to="/heycleo" replace />} />

                {/* Catch all - redirect to heycleo */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              </LearningHubProvider>
            </OrganizationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
