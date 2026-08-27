import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { assessmentAssignmentService, AssessmentAssignment } from '@/services/assessmentAssignmentService';
import { aiAssessmentService, AIAssessment } from '@/services/aiAssessmentService';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Plus, 
  Users, 
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Trash2,
  Eye,
  Sparkles,
  PenLine,
  ChevronDown,
  Edit,
  BookOpen,
  MoreVertical,
  RefreshCw,
  Loader2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Sidebar from '@/components/navigation/Sidebar';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import CreateAssessmentDialog from '@/components/learningHub/CreateAssessmentDialog';
import { AssessmentPreviewDialog } from '@/components/assessments/AssessmentPreviewDialog';
import CreateAIAssessmentDialog from '@/components/learningHub/CreateAIAssessmentDialog';
import MarkSubmissionDialog from '@/components/assessments/MarkSubmissionDialog';
import ReviewedSubmissionCard from '@/components/assessments/ReviewedSubmissionCard';
import { Progress } from '@/components/ui/progress';
import { getLatestSessionId, markSessionToCompletion } from '@/services/assessmentMarkingService';
import {
  getUnsubmittedAttempts,
  submitOnBehalf,
  resetAssignmentToAssigned,
  UnsubmittedAttempt,
} from '@/services/unsubmittedAttemptsService';

const AssessmentAssignments = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showManualCreateDialog, setShowManualCreateDialog] = useState(false);
  const [showAICreateDialog, setShowAICreateDialog] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('assessments');
  const [previewAssessmentId, setPreviewAssessmentId] = useState<string | null>(null);
  const [refreshConfirmId, setRefreshConfirmId] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{
    assessmentId: string;
    userId: string;
    title?: string;
    studentName?: string;
  } | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);


  // Fetch all assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['all-assignments'],
    queryFn: () => assessmentAssignmentService.getAllAssignments(),
  });

  // Fetch ALL assessments (not just published) for the library view
  const { data: allAssessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ['all-assessments'],
    queryFn: () => aiAssessmentService.getAllAssessments(),
  });

  // Fetch published assessments for assignment dialog
  const { data: assessments } = useQuery({
    queryKey: ['published-assessments'],
    queryFn: () => aiAssessmentService.getPublishedAssessments(),
  });

  // Fetch students/parents for assignment
  const { data: users } = useQuery({
    queryKey: ['assignable-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: () => assessmentAssignmentService.assignAssessment(
      selectedAssessment,
      selectedStudents,
      dueDate || undefined,
      notes || undefined
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
      toast.success('Assessment assigned successfully!');
      setShowAssignDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign assessment');
    },
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => assessmentAssignmentService.deleteAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
      toast.success('Assignment deleted');
    },
  });

  // Delete assessment mutation
  const deleteAssessmentMutation = useMutation({
    mutationFn: (assessmentId: string) => aiAssessmentService.deleteAssessment(assessmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-assessments'] });
      toast.success('Assessment deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete assessment');
    },
  });

  // Refresh assessment mutation - regenerates all questions as variants via OpenAI
  const refreshMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      const { data, error } = await supabase.functions.invoke('refresh-assessment', {
        body: { assessment_id: assessmentId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-assessments'] });
      queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assessment-questions'] });
      toast.success(`Refreshed ${data?.updated ?? ''} questions and cleared previous answers`);
      setRefreshConfirmId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to refresh assessment');
      setRefreshConfirmId(null);
    },
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: (assignmentId: string) => assessmentAssignmentService.markAsReviewed(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
      toast.success('Marked as reviewed');
    },
  });

  // Attempts that hold answers but were never submitted (student forgot to finish).
  const { data: unsubmitted, isLoading: unsubmittedLoading } = useQuery({
    queryKey: ['unsubmitted-attempts'],
    queryFn: getUnsubmittedAttempts,
  });

  const refreshQueues = () => {
    queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
    queryClient.invalidateQueries({ queryKey: ['unsubmitted-attempts'] });
  };

  // Closes the attempt on the student's behalf and immediately AI-marks it.
  const submitOnBehalfMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await submitOnBehalf(sessionId);
      await markSessionToCompletion(sessionId);
    },
    onSuccess: () => {
      refreshQueues();
      toast.success('Attempt submitted and marked');
    },
    onError: (error: any) => {
      refreshQueues();
      toast.error(error?.message || 'Failed to submit attempt');
    },
  });

  const resetAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => resetAssignmentToAssigned(assignmentId),
    onSuccess: () => {
      refreshQueues();
      toast.success('Assignment reset — the student can start again');
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to reset assignment'),
  });

  const filterUnsubmitted = (): UnsubmittedAttempt[] => {
    const list = unsubmitted || [];
    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      a =>
        a.assessmentTitle?.toLowerCase().includes(term) ||
        a.subject?.toLowerCase().includes(term) ||
        getStudentName(a.userId).toLowerCase().includes(term),
    );
  };

  const renderUnsubmittedCard = (attempt: UnsubmittedAttempt) => {
    const busy = submitOnBehalfMutation.isPending && submitOnBehalfMutation.variables === attempt.sessionId;
    return (
      <Card key={attempt.sessionId}>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{attempt.assessmentTitle}</CardTitle>
              <CardDescription>
                {getStudentName(attempt.userId)}
                {attempt.subject ? ` · ${attempt.subject}` : ''}
              </CardDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-muted-foreground">
                <Badge variant="outline">
                  {attempt.answered}
                  {attempt.totalQuestions ? `/${attempt.totalQuestions}` : ''} answered
                </Badge>
                <Badge variant="secondary">
                  {attempt.sessionStatus === 'completed' ? 'Finished, not filed' : 'Left open'}
                </Badge>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Last activity{' '}
                  {attempt.lastActivityAt
                    ? format(new Date(attempt.lastActivityAt), 'd MMM yyyy, HH:mm')
                    : format(new Date(attempt.startedAt), 'd MMM yyyy, HH:mm')}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setReviewTarget({
                    assessmentId: attempt.assessmentId,
                    userId: attempt.userId,
                    title: attempt.assessmentTitle,
                    studentName: getStudentName(attempt.userId),
                  })
                }
              >
                <Eye className="h-4 w-4 mr-2" />
                View answers
              </Button>
              <Button size="sm" disabled={busy} onClick={() => submitOnBehalfMutation.mutate(attempt.sessionId)}>
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Submit &amp; mark
              </Button>
              {attempt.assignmentId && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={resetAssignmentMutation.isPending}
                  onClick={() => resetAssignmentMutation.mutate(attempt.assignmentId!)}
                >
                  Reset to assigned
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  };


  const resetForm = () => {
    setSelectedAssessment('');
    setSelectedStudents([]);
    setDueDate('');
    setNotes('');
  };

  const getStudentName = (userId: string) => {
    const profile = users?.find(u => u.id === userId);
    return profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Unknown student' : 'Unknown student';
  };

  // Marks every submitted attempt for the current filter, one student at a time.
  const markAllSubmissions = async () => {
    const targets = filterAssignments('submitted');
    if (!targets.length) return;
    setBatchProgress({ done: 0, total: targets.length });
    let failed = 0;
    for (let i = 0; i < targets.length; i++) {
      const assignment = targets[i];
      try {
        const sessionId = await getLatestSessionId(assignment.assessment_id, assignment.assigned_to);
        if (sessionId) await markSessionToCompletion(sessionId);
      } catch (error: any) {
        failed++;
        console.error('Batch marking failed for assignment', assignment.id, error?.message);
      }
      setBatchProgress({ done: i + 1, total: targets.length });
    }
    setBatchProgress(null);
    queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
    if (failed) {
      toast.warning(`Marked ${targets.length - failed} of ${targets.length} submissions (${failed} failed)`);
    } else {
      toast.success(`Marked ${targets.length} submissions`);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
      assigned: { variant: 'secondary', label: 'Assigned' },
      in_progress: { variant: 'default', label: 'In Progress' },
      submitted: { variant: 'outline', label: 'Submitted' },
      reviewed: { variant: 'default', label: 'Reviewed' },
    };
    const { variant, label } = config[status] || { variant: 'secondary', label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filterAssignments = (status?: string) => {
    let filtered = assignments || [];

    if (status) {
      filtered = filtered.filter(a => a.status === status);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.assessment?.title?.toLowerCase().includes(term) ||
        a.assessment?.subject?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const sortAssignmentsNewestFirst = (
    list: AssessmentAssignment[],
    dateField: 'submitted_at' | 'reviewed_at' | 'created_at' | 'updated_at'
  ) => {
    return [...list].sort((a, b) => {
      const aDate = a[dateField] ? new Date(a[dateField]!).getTime() : 0;
      const bDate = b[dateField] ? new Date(b[dateField]!).getTime() : 0;
      return bDate - aDate;
    });
  };

  const filterAssessments = () => {
    let filtered = allAssessments || [];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.title?.toLowerCase().includes(term) ||
        a.subject?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  const getAssessmentStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      published: { variant: 'default', label: 'Published' },
      archived: { variant: 'outline', label: 'Archived' },
      processing: { variant: 'outline', label: 'Processing' },
    };
    const { variant, label } = config[status] || { variant: 'secondary', label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleQuickAssign = (assessmentId: string) => {
    setSelectedAssessment(assessmentId);
    setShowAssignDialog(true);
  };

  const renderAssessmentCard = (assessment: AIAssessment) => (
    <Card key={assessment.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">
              {assessment.title || 'Untitled Assessment'}
            </CardTitle>
            <CardDescription className="mt-1">
              {assessment.subject} {assessment.exam_board && `• ${assessment.exam_board}`}
            </CardDescription>
          </div>
          {getAssessmentStatusBadge(assessment.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground space-y-1">
            {assessment.total_marks && <p>{assessment.total_marks} marks</p>}
            {assessment.time_limit_minutes && <p>{assessment.time_limit_minutes} mins</p>}
            <p className="text-xs">Created: {format(new Date(assessment.created_at), 'dd MMM yyyy')}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPreviewAssessmentId(assessment.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/assessment/${assessment.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshConfirmId(assessment.id)}
              disabled={refreshMutation.isPending && refreshMutation.variables === assessment.id}
              title="Regenerate all questions as variants"
            >
              {refreshMutation.isPending && refreshMutation.variables === assessment.id ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Refresh
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => deleteAssessmentMutation.mutate(assessment.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {assessment.status === 'published' && (
              <Button 
                size="sm"
                onClick={() => handleQuickAssign(assessment.id)}
              >
                <Users className="h-4 w-4 mr-1" />
                Assign
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAssignmentCard = (assignment: AssessmentAssignment) => (
    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              {assignment.assessment?.title || 'Untitled Assessment'}
            </CardTitle>
            <CardDescription>
              {getStudentName(assignment.assigned_to)} • {assignment.assessment?.subject} • {assignment.assessment?.exam_board}
            </CardDescription>
          </div>
          {getStatusBadge(assignment.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Assigned: {format(new Date(assignment.created_at), 'dd MMM yyyy')}</p>
            {assignment.due_date && (
              <p>Due: {format(new Date(assignment.due_date), 'dd MMM yyyy')}</p>
            )}
            {assignment.submitted_at && (
              <p>Submitted: {format(new Date(assignment.submitted_at), 'dd MMM yyyy HH:mm')}</p>
            )}
          </div>
          <div className="flex gap-2">
            {(assignment.status === 'submitted' || assignment.status === 'reviewed' || assignment.status === 'in_progress') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewTarget({
                  assessmentId: assignment.assessment_id,
                  userId: assignment.assigned_to,
                  title: assignment.assessment?.title,
                  studentName: getStudentName(assignment.assigned_to),
                })}
              >
                <Eye className="h-4 w-4 mr-1" />
                View & Mark
              </Button>
            )}
            {assignment.status === 'submitted' && (
              <Button 
                size="sm" 
                onClick={() => reviewMutation.mutate(assignment.id)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Reviewed
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Reviewed papers expand in place to show answers, marks and AI feedback.
  const renderReviewedCard = (assignment: AssessmentAssignment) => (
    <ReviewedSubmissionCard
      key={assignment.id}
      assignmentId={assignment.id}
      assessmentId={assignment.assessment_id}
      userId={assignment.assigned_to}
      assessmentTitle={assignment.assessment?.title}
      subject={assignment.assessment?.subject}
      examBoard={assignment.assessment?.exam_board}
      studentName={getStudentName(assignment.assigned_to)}
      submittedAt={assignment.submitted_at}
      reviewedAt={assignment.reviewed_at}
      onOpenMarking={() =>
        setReviewTarget({
          assessmentId: assignment.assessment_id,
          userId: assignment.assigned_to,
          title: assignment.assessment?.title,
          studentName: getStudentName(assignment.assigned_to),
        })
      }
      onDelete={() => deleteAssignmentMutation.mutate(assignment.id)}
    />
  );


  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileMenuButton toggleSidebar={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Assessment Assignments</h1>
                <p className="text-muted-foreground mt-1">
                  Assign assessments to students and track their progress
                </p>
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assessment
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowManualCreateDialog(true)}>
                      <PenLine className="h-4 w-4 mr-2" />
                      Create Manual
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowAICreateDialog(true)}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Create
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" onClick={() => setShowAssignDialog(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Assign to Student
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by assessment title or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tabs */}
            {(assignmentsLoading || assessmentsLoading) ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="assessments">
                    <BookOpen className="h-4 w-4 mr-2" />
                    My Assessments ({filterAssessments().length})
                  </TabsTrigger>
                  <TabsTrigger value="all">All Assignments ({filterAssignments().length})</TabsTrigger>
                  <TabsTrigger value="submitted">
                    Pending Review ({filterAssignments('submitted').length})
                  </TabsTrigger>
                  <TabsTrigger value="unsubmitted">
                    Not Submitted ({filterUnsubmitted().length})
                  </TabsTrigger>
                  <TabsTrigger value="in_progress">In Progress ({filterAssignments('in_progress').length})</TabsTrigger>
                  <TabsTrigger value="reviewed">Reviewed ({filterAssignments('reviewed').length})</TabsTrigger>
                </TabsList>

                <TabsContent value="assessments" className="space-y-4">
                  {filterAssessments().length ? (
                    filterAssessments().map(renderAssessmentCard)
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No assessments created yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Click "Create Assessment" to get started</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                  {filterAssignments().length ? (
                    filterAssignments().map(renderAssignmentCard)
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No assignments found</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="submitted" className="space-y-4">
                  {(() => {
                    const submittedAssignments = sortAssignmentsNewestFirst(
                      filterAssignments('submitted'),
                      'submitted_at'
                    );
                    return (
                      <>
                        {submittedAssignments.length > 0 && (
                          <div className="flex items-center gap-3 rounded-lg border p-3">
                            <Button size="sm" onClick={markAllSubmissions} disabled={!!batchProgress}>
                              {batchProgress ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4 mr-2" />
                              )}
                              Mark all submissions with AI
                            </Button>
                            {batchProgress && (
                              <div className="flex-1 flex items-center gap-3">
                                <Progress value={(batchProgress.done / batchProgress.total) * 100} className="h-2 flex-1" />
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                  {batchProgress.done}/{batchProgress.total}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {submittedAssignments.length ? (
                          submittedAssignments.map(renderAssignmentCard)
                        ) : (
                          <div className="text-center py-12">
                            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No submissions pending review</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </TabsContent>

                <TabsContent value="unsubmitted" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Attempts with real answers that never reached the submitted state — usually a student who
                    forgot to press submit. Submitting on their behalf files the attempt and runs AI marking.
                  </p>
                  {unsubmittedLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : filterUnsubmitted().length ? (
                    filterUnsubmitted().map(renderUnsubmittedCard)
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nothing stranded — every attempt with answers is filed</p>
                    </div>
                  )}
                </TabsContent>



                <TabsContent value="in_progress" className="space-y-4">
                  {filterAssignments('in_progress').length ? (
                    filterAssignments('in_progress').map(renderAssignmentCard)
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No assessments in progress</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reviewed" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Marked papers. Click a card to expand the full breakdown — every question, the
                    student's answer, marks awarded and the AI feedback.
                  </p>
                  {(() => {
                    const reviewedAssignments = sortAssignmentsNewestFirst(
                      filterAssignments('reviewed'),
                      'reviewed_at'
                    );
                    return reviewedAssignments.length ? (
                      reviewedAssignments.map(renderReviewedCard)
                    ) : (
                      <div className="text-center py-12">
                        <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No reviewed assessments</p>
                      </div>
                    );
                  })()}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>

      {reviewTarget && (
        <MarkSubmissionDialog
          open={!!reviewTarget}
          onOpenChange={(open) => !open && setReviewTarget(null)}
          assessmentId={reviewTarget.assessmentId}
          userId={reviewTarget.userId}
          assessmentTitle={reviewTarget.title}
          studentName={reviewTarget.studentName}
        />
      )}

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Assessment</DialogTitle>
            <DialogDescription>
              Select an assessment and students to assign it to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Assessment</Label>
              <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an assessment" />
                </SelectTrigger>
                <SelectContent>
                  {assessments?.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title} ({a.subject})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Students</Label>
              <Select 
                value={selectedStudents[0] || ''} 
                onValueChange={(v) => setSelectedStudents([v])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.first_name} {u.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date (optional)</Label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add instructions or notes for the student..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => assignMutation.mutate()}
              disabled={!selectedAssessment || selectedStudents.length === 0 || assignMutation.isPending}
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Assessment Dialogs */}
      <CreateAssessmentDialog
        isOpen={showManualCreateDialog}
        onClose={() => setShowManualCreateDialog(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['published-assessments'] });
          queryClient.invalidateQueries({ queryKey: ['all-assessments'] });
        }}
      />

      <CreateAIAssessmentDialog
        isOpen={showAICreateDialog}
        onClose={() => setShowAICreateDialog(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['published-assessments'] });
          queryClient.invalidateQueries({ queryKey: ['all-assessments'] });
        }}
      />

      {/* Assessment Preview Dialog */}
      <AssessmentPreviewDialog
        assessmentId={previewAssessmentId}
        open={!!previewAssessmentId}
        onOpenChange={(open) => !open && setPreviewAssessmentId(null)}
      />

      {/* Refresh Confirmation Dialog */}
      <AlertDialog open={!!refreshConfirmId} onOpenChange={(open) => !open && !refreshMutation.isPending && setRefreshConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refresh assessment questions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will regenerate every question as a similar variant (names, numbers and minor wording change; structure, marks and difficulty stay the same). All previous student answers and submissions for this assessment will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={refreshMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (refreshConfirmId) refreshMutation.mutate(refreshConfirmId);
              }}
              disabled={refreshMutation.isPending}
            >
              {refreshMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                'Refresh questions'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AssessmentAssignments;
