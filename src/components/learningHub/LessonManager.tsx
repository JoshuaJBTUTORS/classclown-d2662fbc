import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Video, FileQuestion, LinkIcon, FileText, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { learningHubService } from '@/services/learningHubService';
import { aiAssessmentService } from '@/services/aiAssessmentService';
import { CourseLesson } from '@/types/course';

interface LessonManagerProps {
  moduleId: string;
  courseId: string;
}

const LessonManager: React.FC<LessonManagerProps> = ({ moduleId, courseId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState<Partial<CourseLesson>>({
    title: '',
    description: '',
    content_type: 'video',
    content_url: '',
    content_text: '',
    duration_minutes: 0
  });

  // Fetch lessons for this module
  const { data: module, isLoading } = useQuery({
    queryKey: ['moduleWithLessons', moduleId, courseId],
    queryFn: async () => {
      const modules = await learningHubService.getCourseModules(courseId);
      return modules.find(m => m.id === moduleId);
    },
    enabled: !!moduleId && !!courseId,
  });

  // Fetch available assessments for AI assessment type
  const { data: assessments = [] } = useQuery({
    queryKey: ['publishedAssessments'],
    queryFn: () => aiAssessmentService.getPublishedAssessments(),
    enabled: Boolean(
      newLesson.content_type === 'ai-assessment' || 
      (editingLessonId && module?.lessons?.find(l => l.id === editingLessonId)?.content_type === 'ai-assessment')
    ),
  });

  const createLessonMutation = useMutation({
    mutationFn: (lesson: Partial<CourseLesson>) => 
      learningHubService.createLesson(lesson),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moduleWithLessons', moduleId, courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      setIsAddingLesson(false);
      setNewLesson({
        title: '',
        description: '',
        content_type: 'video',
        content_url: '',
        content_text: '',
        duration_minutes: 0
      });
      toast({
        title: "Lesson created",
        description: "Your lesson has been successfully created",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating lesson",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({id, lesson}: {id: string, lesson: Partial<CourseLesson>}) => 
      learningHubService.updateLesson(id, lesson),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moduleWithLessons', moduleId, courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      setEditingLessonId(null);
      toast({
        title: "Lesson updated",
        description: "Your lesson has been successfully updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating lesson",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => learningHubService.deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moduleWithLessons', moduleId, courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      toast({
        title: "Lesson deleted",
        description: "The lesson has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting lesson",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateLesson = () => {
    if (!newLesson.title?.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your lesson",
        variant: "destructive",
      });
      return;
    }

    if (!newLesson.content_type) {
      toast({
        title: "Content type required",
        description: "Please select a content type for your lesson",
        variant: "destructive",
      });
      return;
    }

    if ((newLesson.content_type === 'video' || newLesson.content_type === 'quiz' || newLesson.content_type === 'ai-assessment') && !newLesson.content_url?.trim()) {
      toast({
        title: "Content URL required",
        description: `Please provide a URL for your ${newLesson.content_type}`,
        variant: "destructive",
      });
      return;
    }

    if (newLesson.content_type === 'text' && !newLesson.content_text?.trim()) {
      toast({
        title: "Content text required",
        description: "Please provide text content for your lesson",
        variant: "destructive",
      });
      return;
    }

    const position = module?.lessons?.length ? module.lessons.length : 0;
    createLessonMutation.mutate({
      ...newLesson,
      module_id: moduleId,
      position,
    });
  };

  const handleUpdateLesson = (id: string, updatedData: Partial<CourseLesson>) => {
    updateLessonMutation.mutate({
      id,
      lesson: updatedData
    });
  };

  const handleDeleteLesson = (id: string) => {
    if (window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      deleteLessonMutation.mutate(id);
    }
  };

  const renderContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Video className="h-4 w-4 mr-2" />;
      case 'quiz':
        return <FileQuestion className="h-4 w-4 mr-2" />;
      case 'ai-assessment':
        return <Brain className="h-4 w-4 mr-2" />;
      case 'text':
        return <FileText className="h-4 w-4 mr-2" />;
      default:
        return <LinkIcon className="h-4 w-4 mr-2" />;
    }
  };

  const renderContentTypeForm = () => {
    const contentType = editingLessonId ? 
      module?.lessons?.find(l => l.id === editingLessonId)?.content_type || 'video' : 
      newLesson.content_type || 'video';

    switch (contentType) {
      case 'video':
        return (
          <div>
            <label className="block text-sm font-medium mb-1">Vimeo Video URL</label>
            <Input
              value={editingLessonId ? 
                module?.lessons?.find(l => l.id === editingLessonId)?.content_url || '' : 
                newLesson.content_url || ''}
              onChange={(e) => {
                if (editingLessonId) {
                  handleUpdateLesson(editingLessonId, { content_url: e.target.value });
                } else {
                  setNewLesson({...newLesson, content_url: e.target.value});
                }
              }}
              placeholder="Enter Vimeo video URL (e.g., https://vimeo.com/123456789)"
            />
            <p className="text-xs text-gray-500 mt-1">Enter the full Vimeo URL for your video</p>
          </div>
        );
      case 'quiz':
        return (
          <div>
            <label className="block text-sm font-medium mb-1">Quizizz Embed Code</label>
            <Input
              value={editingLessonId ? 
                module?.lessons?.find(l => l.id === editingLessonId)?.content_url || '' : 
                newLesson.content_url || ''}
              onChange={(e) => {
                if (editingLessonId) {
                  handleUpdateLesson(editingLessonId, { content_url: e.target.value });
                } else {
                  setNewLesson({...newLesson, content_url: e.target.value});
                }
              }}
              placeholder="Enter Quizizz embed URL or code"
            />
            <p className="text-xs text-gray-500 mt-1">Copy the embed code from Quizizz share options</p>
          </div>
        );
      case 'ai-assessment':
        return (
          <div>
            <label className="block text-sm font-medium mb-1">AI Assessment</label>
            <Select
              value={editingLessonId ? 
                module?.lessons?.find(l => l.id === editingLessonId)?.content_url || '' : 
                newLesson.content_url || ''}
              onValueChange={(value) => {
                if (editingLessonId) {
                  handleUpdateLesson(editingLessonId, { content_url: value });
                } else {
                  setNewLesson({...newLesson, content_url: value});
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an AI assessment" />
              </SelectTrigger>
              <SelectContent>
                {assessments.map((assessment) => (
                  <SelectItem key={assessment.id} value={assessment.id}>
                    {assessment.title} ({assessment.total_marks} marks)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">Choose from published AI assessments</p>
          </div>
        );
      case 'text':
        return (
          <div>
            <label className="block text-sm font-medium mb-1">Lesson Content</label>
            <Textarea
              value={editingLessonId ? 
                module?.lessons?.find(l => l.id === editingLessonId)?.content_text || '' : 
                newLesson.content_text || ''}
              onChange={(e) => {
                if (editingLessonId) {
                  handleUpdateLesson(editingLessonId, { content_text: e.target.value });
                } else {
                  setNewLesson({...newLesson, content_text: e.target.value});
                }
              }}
              placeholder="Enter lesson content text"
              rows={6}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
      <div className="flex justify-between items-center">
        <h4 className="text-md font-medium">Lessons</h4>
        <Button size="sm" onClick={() => setIsAddingLesson(!isAddingLesson)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lesson
        </Button>
      </div>

      {isAddingLesson && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Lesson</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={newLesson.title || ''}
                onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                placeholder="Enter lesson title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <Textarea
                value={newLesson.description || ''}
                onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                placeholder="Enter lesson description"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content Type</label>
              <Select
                value={newLesson.content_type}
                onValueChange={(value) => setNewLesson({...newLesson, content_type: value as 'video' | 'quiz' | 'text' | 'ai-assessment'})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video (Vimeo)</SelectItem>
                  <SelectItem value="quiz">Quiz (Quizizz)</SelectItem>
                  <SelectItem value="ai-assessment">AI Assessment</SelectItem>
                  <SelectItem value="text">Text Content</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {renderContentTypeForm()}
            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
              <Input
                type="number"
                value={newLesson.duration_minutes || ''}
                onChange={(e) => setNewLesson({...newLesson, duration_minutes: parseInt(e.target.value) || 0})}
                placeholder="Enter duration in minutes"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddingLesson(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLesson} disabled={createLessonMutation.isPending}>
              {createLessonMutation.isPending ? 'Creating...' : 'Create Lesson'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : !module?.lessons?.length ? (
        <div className="text-center py-4 text-sm text-gray-500">
          No lessons yet. Add your first lesson!
        </div>
      ) : (
        <div className="space-y-2">
          {module.lessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                {renderContentTypeIcon(lesson.content_type)}
                <span>{lesson.title}</span>
                {lesson.duration_minutes > 0 && (
                  <span className="ml-2 text-xs text-gray-500">{lesson.duration_minutes} min</span>
                )}
              </div>
              <div className="flex space-x-1">
                <Button size="sm" variant="ghost" onClick={() => setEditingLessonId(lesson.id === editingLessonId ? null : lesson.id)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDeleteLesson(lesson.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingLessonId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit Lesson</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={module?.lessons?.find(l => l.id === editingLessonId)?.title || ''}
                onChange={(e) => handleUpdateLesson(editingLessonId, { title: e.target.value })}
                placeholder="Enter lesson title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={module?.lessons?.find(l => l.id === editingLessonId)?.description || ''}
                onChange={(e) => handleUpdateLesson(editingLessonId, { description: e.target.value })}
                placeholder="Enter lesson description"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content Type</label>
              <Select
                value={module?.lessons?.find(l => l.id === editingLessonId)?.content_type || 'video'}
                onValueChange={(value) => handleUpdateLesson(editingLessonId, { content_type: value as 'video' | 'quiz' | 'text' | 'ai-assessment' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video (Vimeo)</SelectItem>
                  <SelectItem value="quiz">Quiz (Quizizz)</SelectItem>
                  <SelectItem value="ai-assessment">AI Assessment</SelectItem>
                  <SelectItem value="text">Text Content</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {renderContentTypeForm()}
            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
              <Input
                type="number"
                value={module?.lessons?.find(l => l.id === editingLessonId)?.duration_minutes || ''}
                onChange={(e) => handleUpdateLesson(editingLessonId, { duration_minutes: parseInt(e.target.value) || 0 })}
                placeholder="Enter duration in minutes"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditingLessonId(null)}>
              Cancel
            </Button>
            <Button onClick={() => setEditingLessonId(null)} disabled={updateLessonMutation.isPending}>
              {updateLessonMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default LessonManager;
