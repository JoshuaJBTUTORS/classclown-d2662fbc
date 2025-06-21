
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { LearningHubProvider } from './contexts/LearningHubContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Index from './pages/Index';
import Calendar from './pages/Calendar';
import Students from './pages/Students';
import Tutors from './pages/Tutors';
import Lessons from './pages/Lessons';
import Auth from './pages/Auth';
import StudentJoinPage from './components/lessons/StudentJoinPage';
import VideoRoom from './pages/VideoRoom';
import LearningHub from './pages/LearningHub';
import LearningHubLayout from './components/learningHub/LearningHubLayout';
import LearningHubDashboard from './pages/LearningHubDashboard';
import LearningHubMyCourses from './pages/LearningHubMyCourses';
import LearningHubSettings from './pages/LearningHubSettings';
import LearningHubRevision from './pages/LearningHubRevision';
import LearningHubAssessments from './pages/LearningHubAssessments';
import CourseDetail from './pages/CourseDetail';
import CourseEdit from './pages/CourseEdit';

function App() {
  const queryClient = new QueryClient();

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OrganizationProvider>
            <LearningHubProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <Calendar />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/students"
                  element={
                    <ProtectedRoute>
                      <Students />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tutors"
                  element={
                    <ProtectedRoute>
                      <Tutors />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lessons"
                  element={
                    <ProtectedRoute>
                      <Lessons />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/join-lesson/:lessonId"
                  element={
                    <ProtectedRoute>
                      <StudentJoinPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Video room route */}
                <Route 
                  path="/video-room/:lessonId" 
                  element={
                    <ProtectedRoute>
                      <VideoRoom />
                    </ProtectedRoute>
                  } 
                />

                {/* Course routes - standalone pages */}
                <Route
                  path="/course/:id"
                  element={
                    <ProtectedRoute>
                      <CourseDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/course/:id/edit"
                  element={
                    <ProtectedRoute>
                      <CourseEdit />
                    </ProtectedRoute>
                  }
                />

                {/* Learning Hub routes */}
                <Route
                  path="/learning-hub"
                  element={
                    <ProtectedRoute>
                      <LearningHubLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<LearningHub />} />
                  <Route path="dashboard" element={<LearningHubDashboard />} />
                  <Route path="my-courses" element={<LearningHubMyCourses />} />
                  <Route path="assessments" element={<LearningHubAssessments />} />
                  <Route path="revision" element={<LearningHubRevision />} />
                  <Route path="settings" element={<LearningHubSettings />} />
                </Route>
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
