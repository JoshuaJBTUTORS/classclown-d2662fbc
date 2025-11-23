import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ManageCourseLinkingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specificationId: string;
  specificationTitle: string;
}

const ManageCourseLinkingsDialog = ({
  open,
  onOpenChange,
  specificationId,
  specificationTitle,
}: ManageCourseLinkingsDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());

  // Fetch all courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, subject, status')
        .eq('status', 'published')
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing course links
  const { data: linkedCourses, isLoading: linksLoading } = useQuery({
    queryKey: ['course-exam-board-links', specificationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_exam_board_specifications')
        .select('course_id, is_default')
        .eq('exam_board_specification_id', specificationId);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Initialize selected courses when links load
  React.useEffect(() => {
    if (linkedCourses) {
      setSelectedCourses(new Set(linkedCourses.map(link => link.course_id)));
    }
  }, [linkedCourses]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const currentLinks = new Set(linkedCourses?.map(link => link.course_id) || []);
      const toAdd = Array.from(selectedCourses).filter(id => !currentLinks.has(id));
      const toRemove = Array.from(currentLinks).filter(id => !selectedCourses.has(id));

      // Add new links
      if (toAdd.length > 0) {
        const { error: addError } = await supabase
          .from('course_exam_board_specifications')
          .insert(
            toAdd.map(courseId => ({
              course_id: courseId,
              exam_board_specification_id: specificationId,
              is_default: false,
            }))
          );
        if (addError) throw addError;
      }

      // Remove old links
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('course_exam_board_specifications')
          .delete()
          .eq('exam_board_specification_id', specificationId)
          .in('course_id', toRemove);
        if (removeError) throw removeError;
      }
    },
    onSuccess: () => {
      toast.success('Course links updated');
      queryClient.invalidateQueries({ queryKey: ['exam-board-specifications'] });
      queryClient.invalidateQueries({ queryKey: ['course-exam-board-links'] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating course links:', error);
      toast.error('Failed to update course links');
    },
  });

  const toggleCourse = (courseId: string) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId);
    } else {
      newSelected.add(courseId);
    }
    setSelectedCourses(newSelected);
  };

  const isLoading = coursesLoading || linksLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Course Links</DialogTitle>
          <DialogDescription>
            Select which courses should use {specificationTitle}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {courses?.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleCourse(course.id)}
                >
                  <Checkbox
                    checked={selectedCourses.has(course.id)}
                    onCheckedChange={() => toggleCourse(course.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{course.title}</p>
                    <p className="text-sm text-muted-foreground">{course.subject}</p>
                  </div>
                  {linkedCourses?.find(l => l.course_id === course.id && l.is_default) && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManageCourseLinkingsDialog;
