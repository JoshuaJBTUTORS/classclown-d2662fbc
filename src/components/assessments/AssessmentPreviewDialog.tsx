import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Clock, Award, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { aiAssessmentService } from "@/services/aiAssessmentService";

interface AssessmentPreviewDialogProps {
  assessmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssessmentPreviewDialog({ 
  assessmentId, 
  open, 
  onOpenChange 
}: AssessmentPreviewDialogProps) {
  const navigate = useNavigate();

  const { data: assessment, isLoading: loadingAssessment } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => aiAssessmentService.getAssessmentById(assessmentId!),
    enabled: !!assessmentId && open,
  });

  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['assessment-questions', assessmentId],
    queryFn: () => aiAssessmentService.getAssessmentQuestions(assessmentId!),
    enabled: !!assessmentId && open,
  });

  const isLoading = loadingAssessment || loadingQuestions;

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'multiple_choice': 'Multiple Choice',
      'short_answer': 'Short Answer',
      'extended_writing': 'Extended Writing',
      'calculation': 'Calculation',
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : assessment ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{assessment.title}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground pt-1">
                {assessment.subject && (
                  <Badge variant="outline">{assessment.subject}</Badge>
                )}
                {assessment.exam_board && (
                  <Badge variant="outline">{assessment.exam_board}</Badge>
                )}
                {assessment.total_marks && (
                  <span className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    {assessment.total_marks} marks
                  </span>
                )}
                {assessment.time_limit_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {assessment.time_limit_minutes} mins
                  </span>
                )}
              </div>
            </DialogHeader>

            <div className="flex-1 min-h-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Questions ({questions.length})
                </h3>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No questions yet</p>
                  <p className="text-sm">
                    {assessment.processing_status === 'processing' 
                      ? 'Questions are being generated...' 
                      : 'Add questions in the edit view'}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {questions.map((question, index) => (
                      <div 
                        key={question.id} 
                        className="border rounded-lg p-3 bg-card"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                Q{question.question_number || index + 1}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {getQuestionTypeLabel(question.question_type)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {question.question_text}
                            </p>
                          </div>
                          <Badge className="shrink-0">
                            {question.marks_available} {question.marks_available === 1 ? 'mark' : 'marks'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/assessment/${assessmentId}/edit`);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Assessment
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Assessment not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
