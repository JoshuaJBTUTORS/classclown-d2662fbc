import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import LearningHub from '@/pages/LearningHub';
import LearningHubLibrary from '@/pages/LearningHubLibrary';
import LearningHubMyCourses from '@/pages/LearningHubMyCourses';
import LearningHubSettings from '@/pages/LearningHubSettings';
import CourseDetails from '@/pages/CourseDetails';
import LessonDetails from '@/pages/LessonDetails';
import ProtectedRoute from '@/components/navigation/ProtectedRoute';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminRoute from '@/components/navigation/AdminRoute';
import Checkout from '@/pages/Checkout';
import PlatformCheckout from '@/pages/PlatformCheckout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />

        <Route path="/learning-hub" element={
          <ProtectedRoute>
            <LearningHub />
          </ProtectedRoute>
        } />
        <Route path="/learning-hub/library" element={
          <ProtectedRoute>
            <LearningHubLibrary />
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
            <CourseDetails />
          </ProtectedRoute>
        } />
        <Route path="/lesson/:lessonId" element={
          <ProtectedRoute>
            <LessonDetails />
          </ProtectedRoute>
        } />
        <Route path="/checkout/:courseId" element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        
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
