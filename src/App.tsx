
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import LearningHub from '@/pages/LearningHub';
import LearningHubMyCourses from '@/pages/LearningHubMyCourses';
import LearningHubSettings from '@/pages/LearningHubSettings';
import CourseDetail from '@/pages/CourseDetail';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CourseCheckout from '@/pages/CourseCheckout';
import PlatformCheckout from '@/pages/PlatformCheckout';
import Unauthorized from '@/pages/Unauthorized';
import Calendar from '@/pages/Calendar';
import Students from '@/pages/Students';
import Tutors from '@/pages/Tutors';
import Progress from '@/pages/Progress';
import Lessons from '@/pages/Lessons';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Staff from '@/pages/Staff';
import Homework from '@/pages/Homework';
import TimeOff from '@/pages/TimeOff';
import TimeOffRequests from '@/pages/TimeOffRequests';
import TrialBookings from '@/pages/TrialBookings';
import TrialBooking from '@/pages/TrialBooking';
import LessonPlans from '@/pages/LessonPlans';
import LessonSummaries from '@/pages/LessonSummaries';
import SchoolProgress from '@/pages/SchoolProgress';
import VideoRoom from '@/pages/VideoRoom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      
      <Route 
        path="/auth" 
        element={
          <ProtectedRoute requireAuth={false}>
            <Auth />
          </ProtectedRoute>
        } 
      />
      
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Main application routes */}
      <Route path="/calendar" element={
        <ProtectedRoute>
          <Calendar />
        </ProtectedRoute>
      } />

      <Route path="/students" element={
        <ProtectedRoute>
          <Students />
        </ProtectedRoute>
      } />

      <Route path="/tutors" element={
        <ProtectedRoute>
          <Tutors />
        </ProtectedRoute>
      } />

      <Route path="/progress" element={
        <ProtectedRoute>
          <Progress />
        </ProtectedRoute>
      } />

      <Route path="/lessons" element={
        <ProtectedRoute>
          <Lessons />
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />

      <Route path="/staff" element={
        <ProtectedRoute>
          <Staff />
        </ProtectedRoute>
      } />

      <Route path="/homework" element={
        <ProtectedRoute>
          <Homework />
        </ProtectedRoute>
      } />

      <Route path="/time-off" element={
        <ProtectedRoute>
          <TimeOff />
        </ProtectedRoute>
      } />

      <Route path="/time-off-requests" element={
        <ProtectedRoute>
          <TimeOffRequests />
        </ProtectedRoute>
      } />

      <Route path="/trial-bookings" element={
        <ProtectedRoute>
          <TrialBookings />
        </ProtectedRoute>
      } />

      <Route path="/trial-booking" element={<TrialBooking />} />

      <Route path="/lesson-plans" element={
        <ProtectedRoute>
          <LessonPlans />
        </ProtectedRoute>
      } />

      <Route path="/lesson-summaries" element={
        <ProtectedRoute>
          <LessonSummaries />
        </ProtectedRoute>
      } />

      <Route path="/school-progress" element={
        <ProtectedRoute>
          <SchoolProgress />
        </ProtectedRoute>
      } />

      <Route path="/video-room/:roomId" element={
        <ProtectedRoute>
          <VideoRoom />
        </ProtectedRoute>
      } />

      {/* Learning Hub routes */}
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
  );
}

export default App;
