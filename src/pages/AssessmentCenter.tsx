import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { assessmentAssignmentService, AssessmentAssignment } from '@/services/assessmentAssignmentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Eye
} from 'lucide-react';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';

const AssessmentCenter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['student-assignments', user?.id],
    queryFn: () => assessmentAssignmentService.getStudentAssignments(),
    enabled: !!user,
  });

  const getStatusBadge = (assignment: AssessmentAssignment) => {
    const statusConfig = {
      assigned: { label: 'Assigned', variant: 'secondary' as const, icon: FileText },
      in_progress: { label: 'In Progress', variant: 'default' as const, icon: Clock },
      submitted: { label: 'Submitted', variant: 'outline' as const, icon: CheckCircle2 },
      reviewed: { label: 'Reviewed', variant: 'default' as const, icon: CheckCircle2 },
    };

    const config = statusConfig[assignment.status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getDueDateBadge = (dueDate?: string) => {
    if (!dueDate) return null;

    const due = new Date(dueDate);
    const now = new Date();
    const isOverdue = isPast(due);
    const isDueSoon = isWithinInterval(due, { start: now, end: addDays(now, 3) });

    if (isOverdue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Overdue
        </Badge>
      );
    }

    if (isDueSoon) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-amber-100 text-amber-800">
          <Clock className="h-3 w-3" />
          Due Soon
        </Badge>
      );
    }

    return null;
  };

  const filterAssignments = (status: string) => {
    if (!assignments) return [];
    
    switch (status) {
      case 'pending':
        return assignments.filter(a => a.status === 'assigned' || a.status === 'in_progress');
      case 'completed':
        return assignments.filter(a => a.status === 'submitted' || a.status === 'reviewed');
      case 'due-soon':
        return assignments.filter(a => {
          if (!a.due_date || a.status === 'submitted' || a.status === 'reviewed') return false;
          const due = new Date(a.due_date);
          return isWithinInterval(due, { start: new Date(), end: addDays(new Date(), 7) });
        });
      default:
        return assignments;
    }
  };

  const handleStartAssessment = (assignment: AssessmentAssignment) => {
    navigate(`/assessment-center/${assignment.id}/take`);
  };

  const renderAssignmentCard = (assignment: AssessmentAssignment) => (
    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {assignment.assessment?.title || 'Untitled Assessment'}
            </CardTitle>
            <CardDescription>
              {assignment.assessment?.subject} • {assignment.assessment?.exam_board}
              {assignment.assessment?.year && ` • ${assignment.assessment.year}`}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {getStatusBadge(assignment)}
            {getDueDateBadge(assignment.due_date)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {assignment.assessment?.total_marks && (
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {assignment.assessment.total_marks} marks
              </span>
            )}
            {assignment.assessment?.time_limit_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {assignment.assessment.time_limit_minutes} mins
              </span>
            )}
            {assignment.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Due: {format(new Date(assignment.due_date), 'dd MMM yyyy')}
              </span>
            )}
          </div>
          
          {(assignment.status === 'assigned' || assignment.status === 'in_progress') && (
            <Button onClick={() => handleStartAssessment(assignment)}>
              <Play className="h-4 w-4 mr-2" />
              {assignment.status === 'in_progress' ? 'Continue' : 'Start'}
            </Button>
          )}
          
          {(assignment.status === 'submitted' || assignment.status === 'reviewed') && (
            <Button variant="outline" onClick={() => handleStartAssessment(assignment)}>
              <Eye className="h-4 w-4 mr-2" />
              View Submission
            </Button>
          )}
        </div>

        {assignment.notes && (
          <p className="mt-3 text-sm text-muted-foreground border-t pt-3">
            <strong>Instructions:</strong> {assignment.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const renderEmptyState = (message: string) => (
    <div className="text-center py-12">
      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground">{message}</h3>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Assessment Center</h1>
              <p className="text-muted-foreground mt-1">
                Complete your assigned assessments and track your progress
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">
                    All ({assignments?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    Pending ({filterAssignments('pending').length})
                  </TabsTrigger>
                  <TabsTrigger value="due-soon">
                    Due Soon ({filterAssignments('due-soon').length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completed ({filterAssignments('completed').length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {assignments?.length ? (
                    assignments.map(renderAssignmentCard)
                  ) : (
                    renderEmptyState('No assessments assigned yet')
                  )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                  {filterAssignments('pending').length ? (
                    filterAssignments('pending').map(renderAssignmentCard)
                  ) : (
                    renderEmptyState('No pending assessments')
                  )}
                </TabsContent>

                <TabsContent value="due-soon" className="space-y-4">
                  {filterAssignments('due-soon').length ? (
                    filterAssignments('due-soon').map(renderAssignmentCard)
                  ) : (
                    renderEmptyState('No assessments due soon')
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                  {filterAssignments('completed').length ? (
                    filterAssignments('completed').map(renderAssignmentCard)
                  ) : (
                    renderEmptyState('No completed assessments')
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AssessmentCenter;
