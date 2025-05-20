
import { Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';

import Index from './pages/Index';
import Students from './pages/Students';
import Tutors from './pages/Tutors';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import Calendar from './pages/Calendar';
import Lessons from './pages/Lessons';
import Homework from './pages/Homework';

// Initialize QueryClient
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/students" element={<Students />} />
        <Route path="/tutors" element={<Tutors />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/homework" element={<Homework />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
