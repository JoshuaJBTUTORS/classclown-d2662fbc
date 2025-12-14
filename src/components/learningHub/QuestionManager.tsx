
import React, { useState } from 'react';
import { Plus, Edit, Trash2, MoveUp, MoveDown, Image } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { AssessmentQuestion, aiAssessmentService } from '@/services/aiAssessmentService';
import { useToast } from '@/hooks/use-toast';
import CreateQuestionDialog from './CreateQuestionDialog';
import { LatexRenderer } from '@/components/cleo/LatexRenderer';

interface QuestionManagerProps {
  assessmentId: string;
  questions: AssessmentQuestion[];
  onUpdate: () => void;
}

const QuestionManager: React.FC<QuestionManagerProps> = ({ 
  assessmentId, 
  questions, 
  onUpdate 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AssessmentQuestion | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      await aiAssessmentService.deleteQuestion(questionId);
    },
    onSuccess: () => {
      toast({
        title: "Question deleted",
        description: "The question has been successfully removed from the assessment.",
      });
      setDeletingQuestionId(null);
      onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting question",
        description: error.message || "Failed to delete the question. Please try again.",
        variant: "destructive",
      });
      setDeletingQuestionId(null);
    },
  });

  const reorderQuestionMutation = useMutation({
    mutationFn: async ({ questionId, newPosition }: { questionId: string; newPosition: number }) => {
      await aiAssessmentService.updateQuestion(questionId, { position: newPosition });
    },
    onSuccess: () => {
      toast({
        title: "Question moved",
        description: "The question order has been updated.",
      });
      onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Error moving question",
        description: error.message || "Failed to move the question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'short_answer':
        return 'Short Answer';
      case 'extended_writing':
        return 'Extended Writing';
      case 'calculation':
        return 'Calculation';
      default:
        return type;
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    setDeletingQuestionId(questionId);
  };

  const confirmDeleteQuestion = () => {
    if (deletingQuestionId) {
      deleteQuestionMutation.mutate(deletingQuestionId);
    }
  };

  const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    // Calculate new position based on the target question's position
    const targetQuestion = questions[newIndex];
    const newPosition = targetQuestion.position;

    reorderQuestionMutation.mutate({ questionId, newPosition });
  };

  const handleEditQuestion = (question: AssessmentQuestion) => {
    setEditingQuestion(question);
  };

  const handleCloseEditDialog = () => {
    setEditingQuestion(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Questions ({questions.length})</CardTitle>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No questions have been added yet.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Question
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.id} className="border">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Q{question.question_number}</span>
                        <Badge variant="outline">
                          {question.marks_available} marks
                        </Badge>
                        <Badge variant="secondary">
                          {getQuestionTypeLabel(question.question_type)}
                        </Badge>
                        {question.image_url && (
                          <Badge variant="outline" className="text-blue-600">
                            <Image className="h-3 w-3 mr-1" />
                            Image
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {index > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleMoveQuestion(question.id, 'up')}
                            disabled={reorderQuestionMutation.isPending}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                        )}
                        {index < questions.length - 1 && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleMoveQuestion(question.id, 'down')}
                            disabled={reorderQuestionMutation.isPending}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditQuestion(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                          disabled={deleteQuestionMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-gray-700"><LatexRenderer content={question.question_text} /></div>
                      
                      {question.image_url && (
                        <div className="border rounded-lg p-2 bg-gray-50">
                          <img 
                            src={question.image_url} 
                            alt="Question image" 
                            className="max-w-full h-auto max-h-32 rounded"
                          />
                        </div>
                      )}
                      
                      {question.keywords && question.keywords.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-500">Keywords: </span>
                          {question.keywords.map((keyword, i) => (
                            <Badge key={i} variant="outline" className="mr-1 text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Question Dialog */}
      <CreateQuestionDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        assessmentId={assessmentId}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          onUpdate();
        }}
        editingQuestion={null}
        onEditClose={() => {}}
      />

      {/* Edit Question Dialog */}
      {editingQuestion && (
        <CreateQuestionDialog
          isOpen={false}
          onClose={() => {}}
          assessmentId={assessmentId}
          onSuccess={() => {
            handleCloseEditDialog();
            onUpdate();
          }}
          editingQuestion={editingQuestion}
          onEditClose={handleCloseEditDialog}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingQuestionId} onOpenChange={() => setDeletingQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteQuestion}
              disabled={deleteQuestionMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteQuestionMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuestionManager;
