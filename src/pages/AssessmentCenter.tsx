import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { assessmentAssignmentService, AssessmentAssignment } from '@/services/assessmentAssignmentService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Search } from 'lucide-react';
import { isWithinInterval, addDays } from 'date-fns';
import Sidebar from '@/components/navigation/Sidebar';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import { AssessmentHero } from '@/components/assessments/AssessmentHero';
import { AssessmentCard } from '@/components/assessments/AssessmentCard';
import { cn } from '@/lib/utils';

const AssessmentCenter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['student-assignments', user?.id],
    queryFn: () => assessmentAssignmentService.getStudentAssignments(),
    enabled: !!user,
  });

  const visibleAssignments = useMemo(() => {
    if (!assignments) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return assignments;
    return assignments.filter((a) =>
      [a.assessment?.title, a.assessment?.subject, a.assessment?.exam_board]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    );
  }, [assignments, searchTerm]);

  const filterAssignments = (status: string) => {
    switch (status) {
      case 'pending':
        return visibleAssignments.filter(a => a.status === 'assigned' || a.status === 'in_progress');
      case 'completed':
        return visibleAssignments.filter(a => a.status === 'submitted' || a.status === 'reviewed');
      case 'due-soon':
        return visibleAssignments.filter(a => {
          if (!a.due_date || a.status === 'submitted' || a.status === 'reviewed') return false;
          const due = new Date(a.due_date);
          return isWithinInterval(due, { start: new Date(), end: addDays(new Date(), 7) });
        });
      default:
        return visibleAssignments;
    }
  };

  const handleStartAssessment = (assignment: AssessmentAssignment) => {
    navigate(`/assessment-center/${assignment.id}/take`);
  };

  const tabTriggerClass = cn(
    'rounded-full px-5 py-2.5 text-sm font-medium text-muted-foreground',
    'data-[state=active]:bg-foreground data-[state=active]:text-background',
    'data-[state=active]:shadow-[var(--shadow-soft)] transition-colors'
  );

  const renderEmptyState = (message: string) => (
    <div className="rounded-[var(--radius-soft)] bg-pastel-sand p-10 text-center shadow-[var(--shadow-soft)] sm:p-14">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-background/70 text-pastel-sand-foreground">
        {searchTerm ? <Search className="h-7 w-7" /> : <FileText className="h-7 w-7" />}
      </div>
      <h3 className="font-heading text-2xl font-extrabold tracking-tight text-pastel-sand-foreground">
        {searchTerm ? 'No results found' : message}
      </h3>
      {searchTerm && (
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-pastel-sand-foreground/80">
          Nothing matched "{searchTerm}". Try a different assessment, subject or exam board.
        </p>
      )}
    </div>
  );

  const renderGrid = (items: AssessmentAssignment[], emptyMessage: string) =>
    items.length ? (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((assignment, index) => (
          <AssessmentCard
            key={assignment.id}
            assignment={assignment}
            index={index}
            onClick={() => handleStartAssessment(assignment)}
          />
        ))}
      </div>
    ) : (
      renderEmptyState(emptyMessage)
    );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileMenuButton toggleSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <AssessmentHero
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              pendingCount={filterAssignments('pending').length}
              dueSoonCount={filterAssignments('due-soon').length}
              completedCount={filterAssignments('completed').length}
            />

            <div className="mt-8">
              {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} className="h-[248px] rounded-[var(--radius-soft)]" />
                  ))}
                </div>
              ) : (
                <Tabs defaultValue="all" className="space-y-6">
                  <TabsList className="h-auto flex-wrap gap-2 rounded-full bg-card p-2 shadow-[var(--shadow-soft)]">
                    <TabsTrigger value="all" className={tabTriggerClass}>
                      All ({visibleAssignments.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending" className={tabTriggerClass}>
                      Pending ({filterAssignments('pending').length})
                    </TabsTrigger>
                    <TabsTrigger value="due-soon" className={tabTriggerClass}>
                      Due soon ({filterAssignments('due-soon').length})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className={tabTriggerClass}>
                      Completed ({filterAssignments('completed').length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    {renderGrid(visibleAssignments, 'No assessments assigned yet')}
                  </TabsContent>
                  <TabsContent value="pending">
                    {renderGrid(filterAssignments('pending'), 'No pending assessments')}
                  </TabsContent>
                  <TabsContent value="due-soon">
                    {renderGrid(filterAssignments('due-soon'), 'No assessments due soon')}
                  </TabsContent>
                  <TabsContent value="completed">
                    {renderGrid(filterAssignments('completed'), 'No completed assessments')}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AssessmentCenter;
