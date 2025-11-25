import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { aiAssessmentService } from '@/services/aiAssessmentService';
import { useAuth } from '@/contexts/AuthContext';
import AssessmentAccessControl from '@/components/learningHub/AssessmentAccessControl';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import EditAssessmentDetails from '@/components/learningHub/EditAssessmentDetails';
import QuestionManager from '@/components/learningHub/QuestionManager';

const AssessmentEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOwner } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const { data: assessment, isLoading, error, refetch } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => aiAssessmentService.getAssessmentById(id!),
    enabled: !!id,
  });

  const { data: questions, refetch: refetchQuestions } = useQuery({
    queryKey: ['assessmentQuestions', id],
    queryFn: () => aiAssessmentService.getAssessmentQuestions(id!),
    enabled: !!id,
  });

  if (error || (!isLoading && !assessment)) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="container py-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Assessment Not Found</h1>
                <p className="text-gray-600 mb-6">The assessment you're looking for doesn't exist.</p>
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

  return (
    <AssessmentAccessControl 
      assessment={assessment || { id: '', status: 'draft' }} 
      requiredAccess="edit"
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
                
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/assessment/${id}/preview`)}
                >
                  Preview Assessment
                </Button>
              </div>

              <div className="mb-6">
                <h1 className="text-2xl font-bold">Edit Assessment</h1>
                <p className="text-gray-600">
                  {assessment ? `Editing: ${assessment.title}` : 'Loading assessment...'}
                </p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="details">Assessment Details</TabsTrigger>
                  <TabsTrigger value="questions">
                    Questions ({questions?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                  {assessment && (
                    <EditAssessmentDetails 
                      assessment={assessment} 
                      onUpdate={refetch}
                    />
                  )}
                </TabsContent>

                <TabsContent value="questions">
                  {assessment && (
                    <QuestionManager 
                      assessmentId={assessment.id}
                      questions={questions || []}
                      onUpdate={refetchQuestions}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </AssessmentAccessControl>
  );
};

export default AssessmentEdit;
