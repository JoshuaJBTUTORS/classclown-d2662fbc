import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import AuthProvider from './contexts/AuthContext';
import OrganizationProvider from './contexts/OrganizationContext';
import LearningHubProvider from './contexts/LearningHubContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Students from './pages/Students';
import Tutors from './pages/Tutors';
import Lessons from './pages/Lessons';
import Finances from './pages/Finances';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import StudentJoinPage from './components/lessons/StudentJoinPage';
import VideoRoom from './pages/VideoRoom';

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
                      <Dashboard />
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
                  path="/finances"
                  element={
                    <ProtectedRoute>
                      <Finances />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
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
                
                {/* Add the new video room route */}
                <Route 
                  path="/video-room/:lessonId" 
                  element={
                    <ProtectedRoute>
                      <VideoRoom />
                    </ProtectedRoute>
                  } 
                />
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
