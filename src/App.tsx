
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import LearningHub from '@/pages/LearningHub';
import LearningHubMyCourses from '@/pages/LearningHubMyCourses';
import LearningHubSettings from '@/pages/LearningHubSettings';
import CourseDetail from '@/pages/CourseDetail';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CourseCheckout from '@/pages/CourseCheckout';
import PlatformCheckout from '@/pages/PlatformCheckout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />

        <Route path="/learning-hub" element={
          <ProtectedRoute>
            <LearningHub />
          </ProtectedRoute>
        } />
        <Route path="/learning-hub/my-courses" element={
          <ProtectedRoute>
            <LearningHubMyCourses />
          </ProtectedRoute>
        } />
        <Route path="/learning-hub/settings" element={
          <ProtectedRoute>
            <LearningHubSettings />
          </ProtectedRoute>
        } />
        <Route path="/course/:courseId" element={
          <ProtectedRoute>
            <CourseDetail />
          </ProtectedRoute>
        } />
        <Route path="/checkout/:courseId" element={
          <ProtectedRoute>
            <CourseCheckout />
          </ProtectedRoute>
        } />
        
        <Route 
          path="/checkout/platform" 
          element={
            <ProtectedRoute>
              <PlatformCheckout />
            </ProtectedRoute>
          } 
        />
        
      </Routes>
    </Router>
  );
}

export default App;
