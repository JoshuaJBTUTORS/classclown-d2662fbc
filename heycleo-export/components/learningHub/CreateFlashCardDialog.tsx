
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { learningHubService } from '@/services/learningHubService';
import { useToast } from '@/hooks/use-toast';

interface CreateFlashCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  lessonId?: string;
}

const CreateFlashCardDialog: React.FC<CreateFlashCardDialogProps> = ({
  isOpen,
  onClose,
  courseId,
  lessonId,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState({ title: '', content: '' });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: learningHubService.createCourseNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-notes', courseId] });
      setNewNote({ title: '', content: '' });
      onClose();
      toast({
        title: "Flash card created",
        description: "Your flash card has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating flash card",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNote.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your flash card.",
        variant: "destructive",
      });
      return;
    }

    createNoteMutation.mutate({
      course_id: courseId,
      lesson_id: lessonId,
      title: newNote.title,
      content: newNote.content,
    });
  };

  const handleClose = () => {
    setNewNote({ title: '', content: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Flash Card</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Flash card title"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="border-[#e94b7f]/30 focus-visible:ring-[#e94b7f]"
            />
          </div>
          
          <div>
            <Textarea
              placeholder="Write your flash card content here..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              className="border-[#e94b7f]/30 focus-visible:ring-[#e94b7f]"
              rows={4}
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createNoteMutation.isPending}
              className="bg-[#e94b7f] hover:bg-[#e94b7f]/90 text-white"
            >
              <Save className="h-4 w-4 mr-1" />
              {createNoteMutation.isPending ? 'Creating...' : 'Create Flash Card'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFlashCardDialog;
