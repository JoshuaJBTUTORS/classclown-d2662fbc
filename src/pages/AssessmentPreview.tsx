import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Clock, Target, BookOpen, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { aiAssessmentService } from '@/services/aiAssessmentService';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessmentPermissions } from '@/hooks/useAssessmentPermissions';
import AssessmentAccessControl from '@/components/learningHub/AssessmentAccessControl';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';

const AssessmentPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const { data: assessment, isLoading, error } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => aiAssessmentService.getAssessmentById(id!),
    enabled: !!id,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['assessmentQuestions', id],
    queryFn: () => aiAssessmentService.getAssessmentQuestions(id!),
    enabled: !!id,
  });

  const permissions = useAssessmentPermissions(assessment);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="container py-8">
              <Skeleton className="h-8 w-64 mb-6" />
              <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="container py-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Assessment Not Found</h1>
                <p className="text-gray-600 mb-6">The assessment you're looking for doesn't exist or you don't have permission to view it.</p>
                <Button onClick={() => navigate('/heycleo')}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Learning Hub
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AssessmentAccessControl 
      assessment={assessment} 
      requiredAccess="view"
    >
      <div className="flex min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar toggleSidebar={toggleSidebar} />
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="container py-8">
              <div className="flex items-center justify-between mb-6">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/heycleo')} 
                  className="mb-4"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Learning Hub
                </Button>
                
                {permissions.canEdit && (
                  <Button onClick={() => navigate(`/assessment/${id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Assessment
                  </Button>
                )}
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge className={getStatusColor(assessment.status)}>
                      {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">{assessment.title}</CardTitle>
                  {assessment.subject && (
                    <div className="text-sm text-gray-500 flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {assessment.subject}
                      {assessment.exam_board && ` • ${assessment.exam_board}`}
                      {assessment.year && ` • ${assessment.year}`}
                      {assessment.paper_type && ` • ${assessment.paper_type}`}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {assessment.description && (
                    <p className="text-gray-700 mb-4">{assessment.description}</p>
                  )}
                  
                  <div className="flex gap-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      <span>{assessment.total_marks} marks</span>
                    </div>
                    {assessment.time_limit_minutes && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{assessment.time_limit_minutes} minutes</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Questions ({questions?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {questionsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : questions && questions.length > 0 ? (
                    <div className="space-y-4">
                      {questions.map((question, index) => (
                        <div key={question.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">Question {index + 1}</h4>
                            <Badge variant="outline">{question.marks_available} marks</Badge>
                          </div>
                          <p className="text-gray-700 mb-2">{question.question_text}</p>
                          <div className="text-sm text-gray-500">
                            Type: {question.question_type.replace('_', ' ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No questions have been added to this assessment yet.</p>
                      {permissions.canEdit && (
                        <Button 
                          className="mt-4" 
                          onClick={() => navigate(`/assessment/${id}/edit`)}
                        >
                          Add Questions
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </AssessmentAccessControl>
  );
};

export default AssessmentPreview;
