
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { LearningHubProvider } from '@/contexts/LearningHubContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Auth from '@/pages/Auth';
import Index from '@/pages/Index';
import Calendar from '@/pages/Calendar';
import Lessons from '@/pages/Lessons';
import Students from '@/pages/Students';
import Tutors from '@/pages/Tutors';
import Homework from '@/pages/Homework';
import LearningHub from '@/pages/LearningHub';
import CourseDetail from '@/pages/CourseDetail';
import CourseCreate from '@/pages/CourseCreate';
import CourseEdit from '@/pages/CourseEdit';
import Invite from '@/pages/Invite';
import CreateAdmin from '@/pages/CreateAdmin';
import Unauthorized from '@/pages/Unauthorized';
import NotFound from '@/pages/NotFound';
import StudentJoinPage from '@/components/lessons/StudentJoinPage';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
          <LearningHubProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Public routes */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/invite/:token" element={<Invite />} />
                  <Route path="/create-admin" element={<CreateAdmin />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route path="/join-lesson/:lessonId" element={<StudentJoinPage />} />
                  
                  {/* Protected routes */}
                  <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                  <Route path="/lessons" element={<ProtectedRoute><Lessons /></ProtectedRoute>} />
                  <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
                  <Route path="/tutors" element={<ProtectedRoute><Tutors /></ProtectedRoute>} />
                  <Route path="/homework" element={<ProtectedRoute><Homework /></ProtectedRoute>} />
                  <Route path="/learning-hub" element={<ProtectedRoute><LearningHub /></ProtectedRoute>} />
                  <Route path="/course/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
                  <Route path="/course/:id/edit" element={<ProtectedRoute><CourseEdit /></ProtectedRoute>} />
                  <Route path="/create-course" element={<ProtectedRoute><CourseCreate /></ProtectedRoute>} />
                  
                  {/* Fallback routes */}
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </div>
              <Toaster />
            </Router>
          </LearningHubProvider>
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
