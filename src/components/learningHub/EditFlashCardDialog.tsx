
import React, { useState, useEffect } from 'react';
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
import { CourseNote } from '@/types/courseNotes';

interface EditFlashCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  note: CourseNote | null;
}

const EditFlashCardDialog: React.FC<EditFlashCardDialogProps> = ({
  isOpen,
  onClose,
  courseId,
  note,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editNote, setEditNote] = useState({ title: '', content: '' });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, noteData }: { noteId: string; noteData: { title: string; content?: string } }) =>
      learningHubService.updateCourseNote(noteId, noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-notes', courseId] });
      onClose();
      toast({
        title: "Flash card updated",
        description: "Your flash card has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating flash card",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (note) {
      setEditNote({ title: note.title, content: note.content || '' });
    }
  }, [note]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editNote.title.trim() || !note) {
      toast({
        title: "Title required",
        description: "Please enter a title for your flash card.",
        variant: "destructive",
      });
      return;
    }

    updateNoteMutation.mutate({
      noteId: note.id,
      noteData: editNote,
    });
  };

  const handleClose = () => {
    setEditNote({ title: '', content: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Flash Card</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Flash card title"
              value={editNote.title}
              onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
              className="border-[#e94b7f]/30 focus-visible:ring-[#e94b7f]"
            />
          </div>
          
          <div>
            <Textarea
              placeholder="Write your flash card content here..."
              value={editNote.content}
              onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
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
              disabled={updateNoteMutation.isPending}
              className="bg-[#e94b7f] hover:bg-[#e94b7f]/90 text-white"
            >
              <Save className="h-4 w-4 mr-1" />
              {updateNoteMutation.isPending ? 'Updating...' : 'Update Flash Card'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFlashCardDialog;
