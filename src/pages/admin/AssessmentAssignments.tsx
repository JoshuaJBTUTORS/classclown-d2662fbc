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
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import CreateAssessmentDialog from '@/components/learningHub/CreateAssessmentDialog';
import { AssessmentPreviewDialog } from '@/components/assessments/AssessmentPreviewDialog';
import CreateAIAssessmentDialog from '@/components/learningHub/CreateAIAssessmentDialog';

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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (assignmentId: string) => assessmentAssignmentService.deleteAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
      toast.success('Assignment deleted');
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

  const resetForm = () => {
    setSelectedAssessment('');
    setSelectedStudents([]);
    setDueDate('');
    setNotes('');
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
              {assignment.assessment?.subject} • {assignment.assessment?.exam_board}
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
              onClick={() => deleteMutation.mutate(assignment.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={() => setSidebarOpen(true)} />
        
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
                  {filterAssignments('submitted').length ? (
                    filterAssignments('submitted').map(renderAssignmentCard)
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No submissions pending review</p>
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
                  {filterAssignments('reviewed').length ? (
                    filterAssignments('reviewed').map(renderAssignmentCard)
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No reviewed assessments</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>

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
    </div>
  );
};

export default AssessmentAssignments;
