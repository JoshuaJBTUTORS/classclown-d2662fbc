
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { learningHubService } from '@/services/learningHubService';
import { useToast } from '@/hooks/use-toast';
import { CourseNote } from '@/types/courseNotes';
import CreateFlashCardDialog from './CreateFlashCardDialog';
import EditFlashCardDialog from './EditFlashCardDialog';

interface NotesSectionProps {
  courseId: string;
  lessonId?: string;
  lessonTitle?: string;
}

const NotesSection: React.FC<NotesSectionProps> = ({ 
  courseId, 
  lessonId, 
  lessonTitle 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CourseNote | null>(null);

  // Fetch notes
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['course-notes', courseId, lessonId],
    queryFn: () => learningHubService.getCourseNotes(courseId, lessonId),
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: learningHubService.deleteCourseNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-notes', courseId] });
      toast({
        title: "Flash card deleted",
        description: "Your flash card has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting flash card",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleEditNote = (note: CourseNote) => {
    setSelectedNote(note);
    setShowEditDialog(true);
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Are you sure you want to delete this flash card?')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm">Flash Cards</h3>
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="sm"
            className="bg-[#e94b7f] hover:bg-[#e94b7f]/90 text-white text-xs px-3 py-1 h-auto"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        {lessonTitle && (
          <p className="text-xs text-gray-500">For: {lessonTitle}</p>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            Loading flash cards...
          </div>
        ) : notes.length === 0 ? (
          <div className="p-6 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-3">No flash cards yet</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              size="sm"
              variant="outline"
              className="text-xs border-[#e94b7f]/30 text-[#e94b7f] hover:bg-[#e94b7f]/10"
            >
              Create your first flash card
            </Button>
          </div>
        ) : (
          <div className="p-2">
            {notes.map((note, index) => (
              <div
                key={note.id}
                className={`p-3 border-b border-gray-100 hover:bg-gray-50 group transition-colors ${
                  index === notes.length - 1 ? 'border-b-0' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-[#e94b7f] mb-1 truncate">
                      {note.title}
                    </h4>
                    {note.content && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {note.content}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatDate(note.created_at)}
                      {note.updated_at !== note.created_at && (
                        <span className="ml-1">(edited)</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <Button
                      onClick={() => handleEditNote(note)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-[#e94b7f] hover:bg-[#e94b7f]/10"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteNote(note.id)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Dialogs */}
      <CreateFlashCardDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        courseId={courseId}
        lessonId={lessonId}
      />

      <EditFlashCardDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedNote(null);
        }}
        courseId={courseId}
        note={selectedNote}
      />
    </div>
  );
};

export default NotesSection;
