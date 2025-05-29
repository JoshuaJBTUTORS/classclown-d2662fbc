import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Archive, 
  ArchiveRestore,
  Play,
  Clock,
  Target,
  BookOpen,
  Bot,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AIAssessment } from '@/services/aiAssessmentService';
import { supabase } from '@/integrations/supabase/client';

interface AssessmentCardProps {
  assessment: AIAssessment;
  onUpdate: () => void;
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({ assessment, onUpdate }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: 'draft' | 'published' | 'archived') => {
      const { error } = await supabase
        .from('ai_assessments')
        .update({ status: newStatus })
        .eq('id', assessment.id);
      
      if (error) throw error;
    },
    onSuccess: (_, newStatus) => {
      toast({
        title: "Status updated",
        description: `Assessment ${newStatus === 'published' ? 'published' : newStatus === 'archived' ? 'archived' : 'moved to draft'} successfully`,
      });
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('ai_assessments')
        .delete()
        .eq('id', assessment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Assessment deleted",
        description: "The assessment has been permanently deleted",
      });
      onUpdate();
      setIsDeleting(false);
    },
    onError: (error) => {
      toast({
        title: "Error deleting assessment",
        description: error.message,
        variant: "destructive",
      });
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      setIsDeleting(true);
      deleteMutation.mutate();
    }
  };

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

  const getProcessingStatusBadge = () => {
    if (!assessment.is_ai_generated) return null;

    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={statusColors[assessment.processing_status as keyof typeof statusColors] || statusColors.pending}>
        <Bot className="mr-1 h-3 w-3" />
        {assessment.processing_status === 'pending' && 'AI Pending'}
        {assessment.processing_status === 'processing' && 'AI Processing'}
        {assessment.processing_status === 'completed' && 'AI Generated'}
        {assessment.processing_status === 'failed' && 'AI Failed'}
      </Badge>
    );
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-wrap gap-2">
            <Badge className={getStatusColor(assessment.status)}>
              {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
            </Badge>
            {getProcessingStatusBadge()}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigate(`/assessment/${assessment.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/assessment/${assessment.id}/preview`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                <span>Preview</span>
              </DropdownMenuItem>
              
              {assessment.status !== 'published' && (
                <DropdownMenuItem
                  onClick={() => updateStatusMutation.mutate('published')}
                >
                  <Play className="mr-2 h-4 w-4" />
                  <span>Publish</span>
                </DropdownMenuItem>
              )}
              
              {assessment.status === 'published' && (
                <DropdownMenuItem
                  onClick={() => updateStatusMutation.mutate('draft')}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Move to Draft</span>
                </DropdownMenuItem>
              )}
              
              {assessment.status !== 'archived' && (
                <DropdownMenuItem
                  onClick={() => updateStatusMutation.mutate('archived')}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  <span>Archive</span>
                </DropdownMenuItem>
              )}
              
              {assessment.status === 'archived' && (
                <DropdownMenuItem
                  onClick={() => updateStatusMutation.mutate('draft')}
                >
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  <span>Restore</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600 focus:text-red-600"
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>{isDeleting ? "Deleting..." : "Delete"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-xl font-bold leading-tight mt-2">
          {assessment.title}
        </CardTitle>
        {assessment.subject && (
          <div className="text-sm text-gray-500 flex items-center mt-1">
            <BookOpen className="h-3.5 w-3.5 mr-1" />
            {assessment.subject}
            {assessment.exam_board && ` • ${assessment.exam_board}`}
            {assessment.is_ai_generated && (
              <div className="flex items-center ml-2 text-blue-600">
                <Bot className="h-3.5 w-3.5 mr-1" />
                AI Generated
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assessment.description && (
            <p className="text-sm text-gray-700 line-clamp-2">
              {assessment.description}
            </p>
          )}
          
          {/* Show AI confidence score if available */}
          {assessment.is_ai_generated && assessment.ai_confidence_score && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">AI Confidence: </span>
              <span className={`${assessment.ai_confidence_score > 0.8 ? 'text-green-600' : assessment.ai_confidence_score > 0.6 ? 'text-yellow-600' : 'text-red-600'}`}>
                {(assessment.ai_confidence_score * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {/* Show processing error if failed */}
          {assessment.processing_status === 'failed' && assessment.processing_error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              <span className="font-medium">Processing Error: </span>
              {assessment.processing_error}
            </div>
          )}
          
          <div className="flex justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <Target className="h-4 w-4 mr-1" />
              <span>{assessment.total_marks} marks</span>
            </div>
            {assessment.time_limit_minutes && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{assessment.time_limit_minutes} min</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2 mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate(`/assessment/${assessment.id}/preview`)}
            >
              Preview
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => navigate(`/assessment/${assessment.id}/edit`)}
            >
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssessmentCard;
