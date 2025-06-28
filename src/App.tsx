import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { LearningHubProvider } from "@/contexts/LearningHubContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Tutors from "./pages/Tutors";
import Lessons from "./pages/Lessons";
import LessonPlans from "./pages/LessonPlans";
import Calendar from "./pages/Calendar";
import Progress from "./pages/Progress";
import Reports from "./pages/Reports";
import Homework from "./pages/Homework";
import VideoRoom from "./pages/VideoRoom";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import InteractiveSignup from "./pages/InteractiveSignup";
import LandingPage from "./pages/LandingPage";
import TrialBooking from "./pages/TrialBooking";
import Invite from "./pages/Invite";
import CourseCheckout from "./pages/CourseCheckout";
import TimeOff from "./pages/TimeOff";
import TimeOffRequests from "./pages/TimeOffRequests";
import TrialBookings from "./pages/TrialBookings";
import CreateAdmin from "./pages/CreateAdmin";
import LearningHubEntry from "./pages/learningHub/LearningHubEntry";
import LearningHubDashboard from "./pages/learningHub/LearningHubDashboard";
import LearningHubMyCourses from "./pages/learningHub/LearningHubMyCourses";
import LearningHubAssessments from "./pages/learningHub/LearningHubAssessments";
import LearningHubRevision from "./pages/learningHub/LearningHubRevision";
import LearningHubSettings from "./pages/learningHub/LearningHubSettings";
import CourseDetail from "./pages/learningHub/CourseDetail";
import CourseEdit from "./pages/learningHub/CourseEdit";
import CourseCreate from "./pages/learningHub/CourseCreate";
import AssessmentEdit from "./pages/learningHub/AssessmentEdit";
import AssessmentPreview from "./pages/learningHub/AssessmentPreview";
import LearningHub from "./pages/learningHub/LearningHub";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <OrganizationProvider>
              <LearningHubProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<InteractiveSignup />} />
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/trial-booking" element={<TrialBooking />} />
                  <Route path="/invite/:token" element={<Invite />} />
                  <Route path="/course/:courseId/checkout" element={<CourseCheckout />} />
                  
                  {/* Protected Routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
                  <Route path="/tutors" element={<ProtectedRoute><Tutors /></ProtectedRoute>} />
                  <Route path="/lessons" element={<ProtectedRoute><Lessons /></ProtectedRoute>} />
                  <Route path="/lesson-plans" element={<ProtectedRoute><LessonPlans /></ProtectedRoute>} />
                  <Route path="/lesson-plans/:subject" element={<ProtectedRoute><LessonPlans /></ProtectedRoute>} />
                  <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                  <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/homework" element={<ProtectedRoute><Homework /></ProtectedRoute>} />
                  <Route path="/video-room/:lessonId" element={<ProtectedRoute><VideoRoom /></ProtectedRoute>} />
                  <Route path="/time-off" element={<ProtectedRoute><TimeOff /></ProtectedRoute>} />
                  <Route path="/time-off-requests" element={<ProtectedRoute><TimeOffRequests /></ProtectedRoute>} />
                  <Route path="/trial-bookings" element={<ProtectedRoute><TrialBookings /></ProtectedRoute>} />
                  <Route path="/create-admin" element={<ProtectedRoute><CreateAdmin /></ProtectedRoute>} />
                  
                  {/* Learning Hub Routes */}
                  <Route path="/learning-hub" element={<ProtectedRoute><LearningHubEntry /></ProtectedRoute>} />
                  <Route path="/learning-hub/dashboard" element={<ProtectedRoute><LearningHubDashboard /></ProtectedRoute>} />
                  <Route path="/learning-hub/my-courses" element={<ProtectedRoute><LearningHubMyCourses /></ProtectedRoute>} />
                  <Route path="/learning-hub/assessments" element={<ProtectedRoute><LearningHubAssessments /></ProtectedRoute>} />
                  <Route path="/learning-hub/revision" element={<ProtectedRoute><LearningHubRevision /></ProtectedRoute>} />
                  <Route path="/learning-hub/settings" element={<ProtectedRoute><LearningHubSettings /></ProtectedRoute>} />
                  <Route path="/learning-hub/course/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
                  <Route path="/learning-hub/course/:courseId/edit" element={<ProtectedRoute><CourseEdit /></ProtectedRoute>} />
                  <Route path="/learning-hub/course/create" element={<ProtectedRoute><CourseCreate /></ProtectedRoute>} />
                  <Route path="/learning-hub/assessment/:assessmentId/edit" element={<ProtectedRoute><AssessmentEdit /></ProtectedRoute>} />
                  <Route path="/learning-hub/assessment/:assessmentId/preview" element={<ProtectedRoute><AssessmentPreview /></ProtectedRoute>} />
                  <Route path="/learning-hub" element={<ProtectedRoute><LearningHub /></ProtectedRoute>} />
                  
                  {/* Error Routes */}
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </LearningHubProvider>
            </OrganizationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
