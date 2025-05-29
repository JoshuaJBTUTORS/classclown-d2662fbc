
import React, { useState } from 'react';
import { Plus, Edit, Trash2, MoveUp, MoveDown, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AssessmentQuestion } from '@/services/aiAssessmentService';
import CreateQuestionDialog from './CreateQuestionDialog';

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AssessmentQuestion | null>(null);

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
                          <Button variant="ghost" size="sm">
                            <MoveUp className="h-4 w-4" />
                          </Button>
                        )}
                        {index < questions.length - 1 && (
                          <Button variant="ghost" size="sm">
                            <MoveDown className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingQuestion(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-gray-700">{question.question_text}</p>
                      
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

      <CreateQuestionDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        assessmentId={assessmentId}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          onUpdate();
        }}
        editingQuestion={editingQuestion}
        onEditClose={() => setEditingQuestion(null)}
      />
    </div>
  );
};

export default QuestionManager;
