
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { LearningHubProvider } from '@/contexts/LearningHubContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AuthRedirect from '@/components/routing/AuthRedirect';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

import InteractiveSignup from './pages/InteractiveSignup';
import Index from './pages/Index';
import Calendar from './pages/Calendar';
import Students from './pages/Students';
import Tutors from './pages/Tutors';
import Lessons from './pages/Lessons';
import LessonPlans from './pages/LessonPlans';
import Auth from './pages/Auth';
import Homework from './pages/Homework';
import Progress from './pages/Progress';
import Reports from './pages/Reports';
import TimeOff from './pages/TimeOff';
import TimeOffRequests from './pages/TimeOffRequests';
import TrialBookings from './pages/TrialBookings';
import TrialBooking from './pages/TrialBooking';
import TrialBookingConfirmation from './pages/TrialBookingConfirmation';
import StudentJoinPage from './components/lessons/StudentJoinPage';
import VideoRoom from './pages/VideoRoom';
import LearningHub from './pages/LearningHub';
import LearningHubLayout from './components/learningHub/LearningHubLayout';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import BlogManagement from './pages/BlogManagement';
import BlogEdit from './pages/BlogEdit';
import MainLayout from './components/layout/MainLayout';
import LearningHubDashboard from './pages/LearningHubDashboard';
import LearningHubMyCourses from './pages/LearningHubMyCourses';
import LearningHubSettings from './pages/LearningHubSettings';
import LearningHubRevision from './pages/LearningHubRevision';
import LearningHubAssessments from './pages/LearningHubAssessments';
import CourseDetail from './pages/CourseDetail';
import ModuleDetail from './pages/ModuleDetail';
import CourseEdit from './pages/CourseEdit';
import CourseCheckout from './pages/CourseCheckout';
import CourseCreate from './pages/CourseCreate';
import AssessmentEdit from './pages/AssessmentEdit';
import AssessmentPreview from './pages/AssessmentPreview';
import Settings from './pages/Settings';
import JBTutorsPreview from './pages/JBTutorsPreview';
import SchoolProgress from './pages/SchoolProgress';
import CreateAdmin from './pages/CreateAdmin';
import Staff from './pages/Staff';
import LessonSummaries from './pages/LessonSummaries';
import Earnings from './pages/Earnings';


function App() {
  const queryClient = new QueryClient();

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
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
                
                <Route path="/book-trial" element={<TrialBooking />} />
                <Route path="/trial-booking-confirmation" element={<TrialBookingConfirmation />} />
                <Route path="/jb-tutors-preview" element={<JBTutorsPreview />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                
                {/* Main App Layout - all main application routes */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="calendar" element={<Calendar />} />
                  <Route 
                    path="students" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner', 'parent']}>
                        <Students />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="tutors" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <Tutors />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="lessons" element={<Lessons />} />
                  <Route 
                    path="lesson-plans" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner', 'tutor', 'parent', 'student', 'learning_hub_only']}>
                        <LessonPlans />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="homework" element={<Homework />} />
                  <Route path="lesson-summaries" element={<LessonSummaries />} />
                  <Route 
                    path="earnings" 
                    element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <Earnings />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="progress" element={<Progress />} />
                  <Route 
                    path="reports" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner', 'tutor']}>
                        <Reports />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="time-off" 
                    element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TimeOff />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="time-off-requests" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <TimeOffRequests />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="trial-bookings" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <TrialBookings />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="settings" 
                    element={<Settings />} 
                  />
                  <Route 
                    path="school-progress" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner', 'student', 'parent']}>
                        <SchoolProgress />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="staff" 
                    element={
                      <ProtectedRoute allowedRoles={['owner']}>
                        <Staff />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="blog-management" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <BlogManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="blog-management/edit/:id" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <BlogEdit />
                      </ProtectedRoute>
                    } 
                  />
                </Route>
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

                {/* Course routes - restricted to admin/owner/tutor */}
                <Route
                  path="/course/create"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'owner', 'tutor']}>
                      <CourseCreate />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/course/:id"
                  element={
                    <ProtectedRoute>
                      <CourseDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/course/:courseId/module/:moduleId"
                  element={
                    <ProtectedRoute>
                      <ModuleDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/course/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'owner', 'tutor']}>
                      <CourseEdit />
                    </ProtectedRoute>
                  }
                />

                {/* Checkout route */}
                <Route
                  path="/checkout/:courseId"
                  element={
                    <ProtectedRoute>
                      <CourseCheckout />
                    </ProtectedRoute>
                  }
                />

                {/* Assessment routes */}
                <Route
                  path="/assessment/:id/edit"
                  element={
                    <ProtectedRoute>
                      <AssessmentEdit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assessment/:id/preview"
                  element={
                    <ProtectedRoute>
                      <AssessmentPreview />
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
                  <Route path="library" element={<LearningHub />} />
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
