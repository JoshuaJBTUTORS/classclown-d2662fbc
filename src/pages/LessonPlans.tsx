
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import SubjectDetailDialog from '@/components/lessonPlans/SubjectDetailDialog';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { cn } from '@/lib/utils';

interface LessonPlan {
  id: string;
  subject: string;
  term: string;
  week_number: number;
  topic_title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const LessonPlans: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<LessonPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, isOwner, isTutor } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Get unique subjects from lesson plans
  const subjects = Array.from(new Set(lessonPlans.map(plan => plan.subject))).sort();

  // Group lesson plans by subject with stats
  const subjectStats = subjects.map(subject => {
    const subjectPlans = lessonPlans.filter(plan => plan.subject === subject);
    const terms = Array.from(new Set(subjectPlans.map(plan => plan.term)));
    const weeks = Array.from(new Set(subjectPlans.map(plan => plan.week_number))).length;
    
    return {
      subject,
      totalPlans: subjectPlans.length,
      terms: terms.length,
      weeks,
      lastUpdated: subjectPlans.reduce((latest, plan) => 
        new Date(plan.updated_at) > new Date(latest) ? plan.updated_at : latest, 
        subjectPlans[0]?.updated_at || ''
      )
    };
  });

  useEffect(() => {
    if (isAdmin || isOwner || isTutor) {
      fetchLessonPlans();
    }
  }, [isAdmin, isOwner, isTutor]);

  useEffect(() => {
    filterPlans();
  }, [searchTerm, lessonPlans]);

  const fetchLessonPlans = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lesson_plans')
        .select('*')
        .order('subject', { ascending: true })
        .order('week_number', { ascending: true });

      if (error) throw error;
      setLessonPlans(data || []);
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
      toast.error('Failed to load lesson plans');
    } finally {
      setIsLoading(false);
    }
  };

  const filterPlans = () => {
    let filtered = lessonPlans;
    
    if (searchTerm) {
      filtered = filtered.filter(plan =>
        plan.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.topic_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.term.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredPlans(filtered);
  };

  if (!isAdmin && !isOwner && !isTutor) {
    return (
      <>
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="flex flex-col flex-1 w-full">
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 md:p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to access lesson plans.</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="flex flex-col flex-1 w-full">
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 md:p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex flex-col flex-1 w-full">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <PageTitle 
              title="Lesson Plans" 
              subtitle="Manage teaching materials and curriculum planning"
              className="mb-4 md:mb-0"
            />
          </div>

          {/* Search and Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search subjects, topics, or terms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{subjects.length}</div>
                <div className="text-sm text-gray-600">Subjects</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{lessonPlans.length}</div>
                <div className="text-sm text-gray-600">Total Plans</div>
              </CardContent>
            </Card>
          </div>

          {/* Subject Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjectStats.map((stats) => (
              <Card key={stats.subject} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{stats.subject}</span>
                    <Badge variant="secondary">{stats.totalPlans} plans</Badge>
                  </CardTitle>
                  <CardDescription>
                    {stats.terms} term{stats.terms !== 1 ? 's' : ''} • {stats.weeks} week{stats.weeks !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last updated:</span>
                      <span>{new Date(stats.lastUpdated).toLocaleDateString()}</span>
                    </div>
                    
                    <Button
                      onClick={() => setSelectedSubject(stats.subject)}
                      className="w-full"
                      variant="outline"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      View Weekly Plans
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {subjects.length === 0 && (
            <Card className="text-center p-8">
              <CardContent>
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lesson Plans Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? `No lesson plans match your search for "${searchTerm}"`
                    : "Get started by creating your first lesson plan"
                  }
                </p>
                {searchTerm && (
                  <Button onClick={() => setSearchTerm('')} variant="outline">
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Subject Detail Dialog */}
          {selectedSubject && (
            <SubjectDetailDialog
              subject={selectedSubject}
              isOpen={!!selectedSubject}
              onClose={() => setSelectedSubject(null)}
              onUpdate={fetchLessonPlans}
            />
          )}
        </main>
      </div>
    </>
  );
};

export default LessonPlans;
