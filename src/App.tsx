
import { Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';

import Index from './pages/Index';
import Students from './pages/Students';
import Tutors from './pages/Tutors';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import Calendar from './pages/Calendar';
import Lessons from './pages/Lessons';
import Homework from './pages/Homework';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Initialize QueryClient
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<ProtectedRoute requireAuth={false}><Auth /></ProtectedRoute>} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected routes - require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Index />} />
            
            {/* Admin/Owner only routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'owner']} />}>
              <Route path="/students" element={<Students />} />
            </Route>
            
            {/* Admin/Owner/Tutor routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'owner', 'tutor']} />}>
              <Route path="/tutors" element={<Tutors />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/lessons" element={<Lessons />} />
              <Route path="/homework" element={<Homework />} />
            </Route>
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
