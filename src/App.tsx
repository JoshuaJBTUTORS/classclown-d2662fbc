
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { LearningHubProvider } from "@/contexts/LearningHubContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import StudentDashboardRedirect from "@/components/routing/StudentDashboardRedirect";

// Page imports
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Calendar from "./pages/Calendar";
import Tutors from "./pages/Tutors";
import Students from "./pages/Students";
import Lessons from "./pages/Lessons";
import Reports from "./pages/Reports";
import Progress from "./pages/Progress";
import Homework from "./pages/Homework";
import CreateAdmin from "./pages/CreateAdmin";
import TrialBooking from "./pages/TrialBooking";
import TrialBookings from "./pages/TrialBookings";
import TimeOff from "./pages/TimeOff";
import TimeOffRequests from "./pages/TimeOffRequests";
import Invite from "./pages/Invite";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

// Learning Hub imports
import LearningHub from "./pages/LearningHub";
import LearningHubDashboard from "./pages/LearningHubDashboard";
import LearningHubMyCourses from "./pages/LearningHubMyCourses";
import LearningHubAssessments from "./pages/LearningHubAssessments";
import LearningHubRevision from "./pages/LearningHubRevision";
import CourseCreate from "./pages/CourseCreate";
import CourseEdit from "./pages/CourseEdit";
import CourseDetail from "./pages/CourseDetail";
import CourseCheckout from "./pages/CourseCheckout";
import AssessmentEdit from "./pages/AssessmentEdit";
import AssessmentPreview from "./pages/AssessmentPreview";

import LearningHubLayout from "./components/learningHub/LearningHubLayout";

const queryClient = new QueryClient();

// Redirect component for course URLs
const CourseRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/learning-hub/course/${id}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OrganizationProvider>
            <LearningHubProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/trial-booking" element={<TrialBooking />} />
                <Route path="/invite/:token" element={<Invite />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Redirect old course URLs to learning hub */}
                <Route path="/course/:id" element={<CourseRedirect />} />

                {/* Learning Hub routes */}
                <Route path="/learning-hub" element={<LearningHubLayout />}>
                  <Route index element={<LearningHubDashboard />} />
                  <Route path="my-courses" element={<LearningHubMyCourses />} />
                  <Route path="assessments" element={<LearningHubAssessments />} />
                  <Route path="revision" element={<LearningHubRevision />} />
                  <Route path="progress" element={<Progress />} />
                  <Route path="library" element={<LearningHub />} />
                  <Route path="course/:id" element={<CourseDetail />} />
                  <Route path="checkout/:courseId" element={<CourseCheckout />} />
                </Route>

                {/* Protected main app routes */}
                <Route path="/" element={<ProtectedRoute><StudentDashboardRedirect /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                <Route path="/tutors" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><Tutors /></ProtectedRoute>} />
                <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
                <Route path="/lessons" element={<ProtectedRoute><Lessons /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><Reports /></ProtectedRoute>} />
                <Route path="/progress-old" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                <Route path="/homework" element={<ProtectedRoute><Homework /></ProtectedRoute>} />
                <Route path="/time-off" element={<ProtectedRoute allowedRoles={['tutor']}><TimeOff /></ProtectedRoute>} />
                <Route path="/time-off-requests" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><TimeOffRequests /></ProtectedRoute>} />
                <Route path="/trial-bookings" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><TrialBookings /></ProtectedRoute>} />
                
                {/* Course management routes (admin/owner only) */}
                <Route path="/course/create" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><CourseCreate /></ProtectedRoute>} />
                <Route path="/course/:id/edit" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><CourseEdit /></ProtectedRoute>} />
                
                {/* Assessment routes */}
                <Route path="/assessment/:id/edit" element={<ProtectedRoute><AssessmentEdit /></ProtectedRoute>} />
                <Route path="/assessment/:id/preview" element={<ProtectedRoute><AssessmentPreview /></ProtectedRoute>} />
                
                {/* Admin only routes */}
                <Route path="/create-admin" element={<ProtectedRoute allowedRoles={['owner']}><CreateAdmin /></ProtectedRoute>} />
                
                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </LearningHubProvider>
          </OrganizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
