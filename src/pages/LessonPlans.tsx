
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import SubjectDetailDialog from '@/components/lessonPlans/SubjectDetailDialog';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import Sidebar from '@/components/navigation/Sidebar';
import { LessonPlansHero } from '@/components/lessonPlans/LessonPlansHero';
import { SubjectCard } from '@/components/lessonPlans/SubjectCard';
import { SubjectCategorySection } from '@/components/lessonPlans/SubjectCategorySection';
import { groupSubjects } from '@/components/lessonPlans/subjectGroups';
import { LessonPlansLoadingSkeleton } from '@/components/lessonPlans/LoadingSkeleton';
import { EmptyState } from '@/components/lessonPlans/EmptyState';
import { getAcademicWeekInfo } from '@/utils/academicWeekUtils';

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
  const { isAdmin, isOwner, isTutor, isStudent, isParent, isLearningHubOnly } = useAuth();
  
  // Get current academic week info
  const academicWeekInfo = getAcademicWeekInfo();
  const isStudentOrParent = isStudent || isParent || isLearningHubOnly;

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
    const weeks = Array.from(new Set(subjectPlans.map(plan => plan.week_number))).length;
    
    return {
      subject,
      totalPlans: subjectPlans.length,
      weeks,
      lastUpdated: subjectPlans.reduce((latest, plan) => 
        new Date(plan.updated_at) > new Date(latest) ? plan.updated_at : latest, 
        subjectPlans[0]?.updated_at || ''
      )
    };
  });

  // Search-filtered subject tiles
  const visibleSubjectStats = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return subjectStats;
    return subjectStats.filter(s => s.subject.toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, lessonPlans]);

  const groupedSubjects = useMemo(
    () => groupSubjects(visibleSubjectStats, s => s.subject),
    [visibleSubjectStats]
  );

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const isGroupOpen = (groupId: string) => {
    if (searchTerm.trim()) return true;
    if (groupId in collapsedGroups) return !collapsedGroups[groupId];
    return false;
  };

  // Calculate total weeks across all subjects
  const totalWeeks = Array.from(new Set(lessonPlans.map(plan => plan.week_number))).length;


  useEffect(() => {
    if (isAdmin || isOwner || isTutor || isStudentOrParent) {
      fetchLessonPlans();
    }
  }, [isAdmin, isOwner, isTutor, isStudentOrParent]);

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
        plan.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredPlans(filtered);
  };

  if (!isAdmin && !isOwner && !isTutor && !isStudentOrParent) {
    return (
      <>
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="flex flex-col flex-1 w-full">
          <MobileMenuButton toggleSidebar={toggleSidebar} />
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
          <MobileMenuButton toggleSidebar={toggleSidebar} />
          <main className="flex-1">
            <LessonPlansLoadingSkeleton />
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex flex-col flex-1 w-full min-h-screen bg-background">
        <MobileMenuButton toggleSidebar={toggleSidebar} />
        
        <main className="flex-1">
          {/* Hero Section */}
          <LessonPlansHero
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            totalSubjects={subjects.length}
            totalPlans={lessonPlans.length}
            totalWeeks={totalWeeks}
          />

          {/* Content Section */}
          <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
            {groupedSubjects.length === 0 ? (
              <EmptyState 
                searchTerm={searchTerm}
                onClearSearch={() => setSearchTerm('')}
              />
            ) : (
              <>
                <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
                  Subjects
                </h2>

                {groupedSubjects.map((group) => (
                  <SubjectCategorySection
                    key={group.id}
                    label={group.label}
                    count={group.items.length}
                    isOpen={isGroupOpen(group.id)}
                    onOpenChange={(open) =>
                      setCollapsedGroups((prev) => ({ ...prev, [group.id]: !open }))
                    }
                  >
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {group.items.map((stats, index) => (
                        <SubjectCard
                          key={stats.subject}
                          subject={stats.subject}
                          totalPlans={stats.totalPlans}
                          weeks={stats.weeks}
                          lastUpdated={stats.lastUpdated}
                          onClick={() => setSelectedSubject(stats.subject)}
                          index={index}
                        />
                      ))}
                    </div>
                  </SubjectCategorySection>
                ))}

              </>
            )}
          </div>


          {/* Subject Detail Dialog */}
          {selectedSubject && (
            <SubjectDetailDialog
              subject={selectedSubject}
              isOpen={!!selectedSubject}
              onClose={() => setSelectedSubject(null)}
              onUpdate={fetchLessonPlans}
              isStudentOrParent={isStudentOrParent}
              currentWeek={academicWeekInfo.currentWeek}
              currentTerm={academicWeekInfo.currentTerm}
              weekRange={academicWeekInfo.weekRange}
            />
          )}
        </main>
      </div>
    </>
  );
};

export default LessonPlans;
