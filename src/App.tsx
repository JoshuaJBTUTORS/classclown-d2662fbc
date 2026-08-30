
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import MetaPixelTracker from '@/components/analytics/MetaPixelTracker';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { useAppVersion } from '@/hooks/useAppVersion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AuthRedirect from '@/components/routing/AuthRedirect';
import { DomainRouteGuard } from '@/components/routing/DomainRouteGuard';

import LoginPage from './pages/LoginPage';


import Index from './pages/Index';
import Calendar from './pages/Calendar';
import Students from './pages/Students';
import StudentsList from './pages/StudentsList';
import Onboarding from './pages/Onboarding';
import StudentDetail from './pages/StudentDetail';
import Tutors from './pages/Tutors';
import Lessons from './pages/Lessons';
import LessonPlans from './pages/LessonPlans';
import Auth from './pages/Auth';
import Homework from './pages/Homework';
import Progress from './pages/Progress';
import Reports from './pages/Reports';
import TimeOff from './pages/TimeOff';
import TimeOffRequests from './pages/TimeOffRequests';
import TopicRequestsApproval from './pages/TopicRequestsApproval';
import TrialBookings from './pages/TrialBookings';
import Referrals from './pages/Referrals';

import TrialBooking from './pages/TrialBooking';
import TrialBookingConfirmation from './pages/TrialBookingConfirmation';
import VideoRoom from './pages/VideoRoom';
import ReferFriend from './pages/ReferFriend';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import MainLayout from './components/layout/MainLayout';
import SubscriptionManagement from './pages/SubscriptionManagement';
import CourseDetail from './pages/CourseDetail';
import ModuleDetail from './pages/ModuleDetail';
import LessonPlanning from './pages/LessonPlanning';
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
import AdminEarnings from './pages/AdminEarnings';
import AdminDashboard from './pages/AdminDashboard';
import Goals from './pages/Goals';
import RevenueExpansion from './pages/RevenueExpansion';
import LiveSessions from './pages/LiveSessions';
import TrialBookingMusa from './pages/TrialBookingMusa';
import ReviewRoom from './pages/ReviewRoom';

import TutorContentPage from './pages/tutor/TutorContentPage';
import ProposalView from './pages/ProposalView';
import UpdateCardDetails from './pages/UpdateCardDetails';
import ProposalBuilder from './pages/ProposalBuilder';
import ProposalDashboard from './pages/admin/ProposalDashboard';
import EditProposal from './pages/admin/EditProposal';
import SignedProposals from './pages/admin/SignedProposals';
import ViewSignedProposal from './pages/admin/ViewSignedProposal';
import OfferView from './pages/OfferView';
import SentOffers from './pages/admin/SentOffers';

import RecurringLessons from './pages/admin/RecurringLessons';
import LessonSpaceReplay from './pages/admin/LessonSpaceReplay';
import PricingPage from './pages/PricingPage';
import HubAccessManagement from './pages/admin/HubAccessManagement';
import AssessmentCenter from './pages/AssessmentCenter';
import AssessmentTake from './pages/AssessmentTake';
import AssessmentAssignments from './pages/admin/AssessmentAssignments';
import HeyCleoData from './pages/admin/HeyCleoData';

import Unauthorized from './pages/Unauthorized';
import AgentCleo from './pages/AgentCleo';

// Component to monitor app version
const AppVersionMonitor = () => {
  useAppVersion();
  return null;
};

// Single shared client — recreating it on every render wipes the cache and
// remounts every screen (losing in-progress form input).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function App() {


  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AppVersionMonitor />
        <MetaPixelTracker />
        <AuthProvider>
            <OrganizationProvider>
              <Routes>
                {/* Root route with auth redirect */}
                <Route path="/" element={<AuthRedirect />} />
                
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                
                <Route path="/auth" element={<Auth />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                
                <Route path="/book-trial" element={<TrialBooking />} />
                <Route path="/book-trial-musa" element={<TrialBookingMusa />} />
                <Route path="/review-room" element={<ReviewRoom />} />
                <Route path="/trial-booking-confirmation" element={<TrialBookingConfirmation />} />
                <Route path="/jb-tutors-preview" element={<JBTutorsPreview />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/proposal/:proposalId/:token" element={<ProposalView />} />
                <Route path="/p/:proposalId/:token" element={<ProposalView />} />
                <Route path="/offer/:offerId/:token" element={<OfferView />} />
                <Route path="/o/:offerId/:token" element={<OfferView />} />
                <Route path="/update-card" element={<UpdateCardDetails />} />
                <Route path="/refer" element={<ReferFriend />} />
               <Route path="/agent-cleo" element={<ProtectedRoute><AgentCleo /></ProtectedRoute>} />
               <Route path="/agent-cleo/:threadId" element={<ProtectedRoute><AgentCleo /></ProtectedRoute>} />

                <Route path="/welcome" element={<ProtectedRoute><WelcomeOnboarding /></ProtectedRoute>} />

                {/* Main App Layout - all main application routes - Restricted on heycleo.io */}
                <Route
                  path="/*"
                  element={
                    <DomainRouteGuard>
                      <ProtectedRoute>
                        <OnboardingGate>
                          <MainLayout />
                        </OnboardingGate>
                      </ProtectedRoute>
                    </DomainRouteGuard>
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
                    path="students-list" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <StudentsList />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="onboarding" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <Onboarding />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="students-list/:studentId" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <StudentDetail />
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
                  <Route
                    path="homework"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <Homework />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="assessment-center" element={<AssessmentCenter />} />
                  <Route path="assessment-center/:assignmentId/take" element={<AssessmentTake />} />
                  <Route 
                    path="assessment-assignments" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <AssessmentAssignments />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="admin/assessment-assignments" element={<Navigate to="/assessment-assignments" replace />} />

                  <Route path="lesson-summaries" element={<LessonSummaries />} />
                  <Route 
                    path="earnings" 
                    element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <Earnings />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="admin-earnings" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <AdminEarnings />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="admin-dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route
                    path="goals"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <Goals />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/revenue-expansion"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <RevenueExpansion />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/live-sessions"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <LiveSessions />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/heycleo-data"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <HeyCleoData />
                      </ProtectedRoute>
                    }
                  />

                  <Route 
                    path="admin/proposals" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <ProposalDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="admin/proposals/create" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <ProposalBuilder />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="admin/proposals/edit/:proposalId" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <EditProposal />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="admin/proposals/signed" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <SignedProposals />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="admin/proposals/:proposalId/view" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <ViewSignedProposal />
                      </ProtectedRoute>
                    } 
                  />
                  <Route
                    path="admin/sent-offers"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <SentOffers />
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
                    path="tutor-content" 
                    element={
                      <ProtectedRoute allowedRoles={['tutor']}>
                        <TutorContentPage />
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
                    path="topic-requests" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <TopicRequestsApproval />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="hub-access" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <HubAccessManagement />
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
                    path="referrals"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <Referrals />
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
                    path="admin/recurring-lessons"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <RecurringLessons />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/lessonspace-replay"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <LessonSpaceReplay />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                
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




                {/* Lesson Planning Route */}
                <Route
                  path="/lesson-planning"
                  element={
                    <ProtectedRoute>
                      <LessonPlanning />
                    </ProtectedRoute>
                  }
                />
              </Routes>
              <Toaster />
            </OrganizationProvider>
          </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
  );
}

export default App;
