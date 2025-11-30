import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Search, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { aiAssessmentService } from '@/services/aiAssessmentService';
import AssessmentCard from './AssessmentCard';
import CreateAssessmentDialog from './CreateAssessmentDialog';
import CreateAIAssessmentDialog from './CreateAIAssessmentDialog';
import CreateExamDialog from './CreateExamDialog';

const AIAssessmentManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAICreateDialogOpen, setIsAICreateDialogOpen] = useState(false);
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  const { data: assessments = [], isLoading, refetch } = useQuery({
    queryKey: ['allAssessments'],
    queryFn: aiAssessmentService.getAllAssessments,
  });

  const triggerAIProcessingMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      const { data, error } = await aiAssessmentService.supabase.functions.invoke('ai-process-assessment', {
        body: { assessmentId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Processing started",
        description: "AI processing has been triggered for pending assessments",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error triggering processing",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetAssessmentMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      const { data, error } = await aiAssessmentService.supabase.functions.invoke('reset-assessment-status', {
        body: { assessmentId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Assessment reset",
        description: "Assessment status has been reset to pending",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error resetting assessment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && assessment.status === activeTab;
  });

  // Group assessments by subject
  const groupedAssessments = filteredAssessments.reduce((groups, assessment) => {
    const subject = assessment.subject || 'No Subject';
    if (!groups[subject]) {
      groups[subject] = [];
    }
    groups[subject].push(assessment);
    return groups;
  }, {} as Record<string, typeof filteredAssessments>);

  const sortedSubjects = Object.keys(groupedAssessments).sort();

  const assessmentCounts = {
    all: assessments.length,
    draft: assessments.filter(a => a.status === 'draft').length,
    published: assessments.filter(a => a.status === 'published').length,
    archived: assessments.filter(a => a.status === 'archived').length,
  };

  // Include both pending and failed assessments, plus stuck processing ones
  const pendingAIAssessments = assessments.filter(a => 
    a.is_ai_generated && (a.processing_status === 'pending' || a.processing_status === 'failed' || a.processing_status === 'processing')
  );

  const stuckProcessingAssessments = assessments.filter(a => 
    a.is_ai_generated && a.processing_status === 'processing'
  );

  const handleTriggerAIProcessing = () => {
    if (pendingAIAssessments.length === 0) {
      toast({
        title: "No pending assessments",
        description: "There are no AI assessments pending processing",
      });
      return;
    }

    // Trigger processing for the first pending assessment
    triggerAIProcessingMutation.mutate(pendingAIAssessments[0].id);
  };

  const handleResetStuckAssessments = () => {
    if (stuckProcessingAssessments.length === 0) {
      toast({
        title: "No stuck assessments",
        description: "There are no assessments stuck in processing",
      });
      return;
    }

    // Reset the first stuck assessment
    resetAssessmentMutation.mutate(stuckProcessingAssessments[0].id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">AI Assessments</h2>
          <p className="text-gray-600">Create and manage AI-powered assessments</p>
        </div>
        <div className="flex gap-2">
          {stuckProcessingAssessments.length > 0 && (
            <Button 
              variant="outline"
              onClick={handleResetStuckAssessments}
              disabled={resetAssessmentMutation.isPending}
            >
              <RotateCcw className={`h-4 w-4 mr-2 ${resetAssessmentMutation.isPending ? 'animate-spin' : ''}`} />
              Reset Stuck ({stuckProcessingAssessments.length})
            </Button>
          )}
          {pendingAIAssessments.length > 0 && (
            <Button 
              variant="outline"
              onClick={handleTriggerAIProcessing}
              disabled={triggerAIProcessingMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${triggerAIProcessingMutation.isPending ? 'animate-spin' : ''}`} />
              Process AI ({pendingAIAssessments.length})
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Manual Create
          </Button>
          <Button onClick={() => setIsAICreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            AI Create
          </Button>
          <Button 
            variant="outline"
            onClick={() => setIsExamDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Exam
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search assessments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All ({assessmentCounts.all})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft ({assessmentCounts.draft})
          </TabsTrigger>
          <TabsTrigger value="published">
            Published ({assessmentCounts.published})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({assessmentCounts.archived})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No assessments found' : 'No assessments yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Create your first AI assessment to get started'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Assessment
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {sortedSubjects.map((subject) => (
                <div key={subject} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{subject}</h3>
                    <span className="text-sm text-muted-foreground">
                      ({groupedAssessments[subject].length} assessment{groupedAssessments[subject].length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedAssessments[subject].map((assessment) => (
                      <AssessmentCard
                        key={assessment.id}
                        assessment={assessment}
                        onUpdate={refetch}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateAssessmentDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          refetch();
        }}
      />

      <CreateAIAssessmentDialog
        isOpen={isAICreateDialogOpen}
        onClose={() => setIsAICreateDialogOpen(false)}
        onSuccess={() => {
          setIsAICreateDialogOpen(false);
          refetch();
        }}
      />

      <CreateExamDialog
        isOpen={isExamDialogOpen}
        onClose={() => setIsExamDialogOpen(false)}
        onSuccess={() => {
          setIsExamDialogOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

export default AIAssessmentManager;
