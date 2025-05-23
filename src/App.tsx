
import { Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { LearningHubProvider } from '@/contexts/LearningHubContext';

import Index from './pages/Index';
import Students from './pages/Students';
import Tutors from './pages/Tutors';
import Auth from './pages/Auth';
import RegisterOrganization from './pages/RegisterOrganization';
import OrganizationSettings from './pages/OrganizationSettings';
import NotFound from './pages/NotFound';
import Calendar from './pages/Calendar';
import Lessons from './pages/Lessons';
import Homework from './pages/Homework';
import LearningHub from './pages/LearningHub';
import CourseDetail from './pages/CourseDetail';
import CourseCreate from './pages/CourseCreate';
import CourseEdit from './pages/CourseEdit';
import Unauthorized from './pages/Unauthorized';
import Invite from './pages/Invite';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Initialize QueryClient
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
          <LearningHubProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<ProtectedRoute requireAuth={false}><Auth /></ProtectedRoute>} />
              <Route path="/register-organization" element={<ProtectedRoute requireAuth={false}><RegisterOrganization /></ProtectedRoute>} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/invite" element={<Invite />} />
              
              {/* Protected routes - require authentication */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Index />} />
                
                {/* Admin/Owner only routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'owner']} />}>
                  <Route path="/students" element={<Students />} />
                  <Route path="/organization/settings" element={<OrganizationSettings />} />
                </Route>
                
                {/* Admin/Owner/Tutor routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'owner', 'tutor']} />}>
                  <Route path="/tutors" element={<Tutors />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/lessons" element={<Lessons />} />
                  <Route path="/homework" element={<Homework />} />
                </Route>

                {/* Learning Hub routes - accessible to all authenticated users */}
                <Route path="/learning-hub" element={<LearningHub />} />
                <Route path="/learning-hub/course/:courseId" element={<CourseDetail />} />
                
                {/* Course management routes - restricted to admin/owner/tutor */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'owner', 'tutor']} />}>
                  <Route path="/learning-hub/create" element={<CourseCreate />} />
                  <Route path="/learning-hub/course/:courseId/edit" element={<CourseEdit />} />
                </Route>
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </LearningHubProvider>
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
