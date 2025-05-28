import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { LearningHubProvider } from '@/contexts/LearningHubContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import StudentDashboardRedirect from '@/components/routing/StudentDashboardRedirect';

// Page imports
import Auth from '@/pages/Auth';
import Calendar from '@/pages/Calendar';
import Lessons from '@/pages/Lessons';
import Students from '@/pages/Students';
import Tutors from '@/pages/Tutors';
import Homework from '@/pages/Homework';
import Progress from '@/pages/Progress';
import LearningHub from '@/pages/LearningHub';
import CourseDetail from '@/pages/CourseDetail';
import CourseCreate from '@/pages/CourseCreate';
import CourseEdit from '@/pages/CourseEdit';
import CreateAdmin from '@/pages/CreateAdmin';
import Invite from '@/pages/Invite';
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/Unauthorized';
import Reports from '@/pages/Reports';

import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OrganizationProvider>
        <Router>
          <AuthProvider>
            <LearningHubProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/invite/:token" element={<Invite />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <StudentDashboardRedirect />
                  </ProtectedRoute>
                } />
                
                <Route path="/calendar" element={
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                } />
                
                <Route path="/lessons" element={
                  <ProtectedRoute>
                    <Lessons />
                  </ProtectedRoute>
                } />
                
                <Route path="/students" element={
                  <ProtectedRoute allowedRoles={['admin', 'owner', 'tutor']}>
                    <Students />
                  </ProtectedRoute>
                } />
                
                <Route path="/tutors" element={
                  <ProtectedRoute allowedRoles={['admin', 'owner']}>
                    <Tutors />
                  </ProtectedRoute>
                } />
                
                <Route path="/homework" element={
                  <ProtectedRoute>
                    <Homework />
                  </ProtectedRoute>
                } />

                <Route path="/progress" element={
                  <ProtectedRoute allowedRoles={['student', 'owner']}>
                    <Progress />
                  </ProtectedRoute>
                } />

                <Route path="/reports" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Reports />
                  </ProtectedRoute>
                } />
                
                <Route path="/learning-hub" element={
                  <ProtectedRoute>
                    <LearningHub />
                  </ProtectedRoute>
                } />
                
                <Route path="/course/:id" element={
                  <ProtectedRoute>
                    <CourseDetail />
                  </ProtectedRoute>
                } />
                
                <Route path="/course/create" element={
                  <ProtectedRoute allowedRoles={['admin', 'owner']}>
                    <CourseCreate />
                  </ProtectedRoute>
                } />
                
                <Route path="/course/:id/edit" element={
                  <ProtectedRoute allowedRoles={['admin', 'owner']}>
                    <CourseEdit />
                  </ProtectedRoute>
                } />
                
                <Route path="/create-admin" element={<CreateAdmin />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </LearningHubProvider>
          </AuthProvider>
        </Router>
      </OrganizationProvider>
    </QueryClientProvider>
  );
}

export default App;
