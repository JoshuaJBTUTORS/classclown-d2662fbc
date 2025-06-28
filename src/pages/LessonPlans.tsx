
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Plus, Upload, Eye, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import SubjectGrid from '@/components/lessonPlans/SubjectGrid';
import SubjectDetail from '@/components/lessonPlans/SubjectDetail';

const LessonPlans = () => {
  const navigate = useNavigate();
  const { subject } = useParams();
  const { userRole, isAdmin, isOwner } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const canManage = isAdmin || isOwner;

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const filteredSubjects = subjects.filter(subj =>
    subj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subj.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (subject) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} />
        <div className="flex flex-col flex-1 lg:pl-64">
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 md:p-6">
            <SubjectDetail
              subject={subject}
              canManage={canManage}
              onBack={() => navigate('/lesson-plans')}
            />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 lg:pl-64">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <PageTitle 
              title="Lesson Plans" 
              subtitle="Manage curriculum and teaching materials"
              className="mb-4 md:mb-0"
            />
            {canManage && (
              <div className="flex items-center gap-2">
                <Button variant="outline" className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Subject
                </Button>
              </div>
            )}
          </div>

          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Subject Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search subjects..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <SubjectGrid
                subjects={filteredSubjects}
                isLoading={isLoading}
                canManage={canManage}
                onSubjectClick={(subjectName) => navigate(`/lesson-plans/${encodeURIComponent(subjectName)}`)}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default LessonPlans;
