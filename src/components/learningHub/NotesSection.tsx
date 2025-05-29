
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
    <div className="h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-rose-50/80">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Flash Cards</h3>
            {lessonTitle && (
              <p className="text-sm text-gray-600">For: {lessonTitle}</p>
            )}
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#e94b7f] hover:bg-[#e94b7f]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Flash Card
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">
            Loading flash cards...
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-800 mb-2">No flash cards yet</h4>
            <p className="text-gray-600 mb-6">Create your first flash card to start organizing your notes</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              variant="outline"
              className="border-[#e94b7f]/30 text-[#e94b7f] hover:bg-[#e94b7f]/10"
            >
              Create your first flash card
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-[#e94b7f] text-sm leading-tight line-clamp-2">
                    {note.title}
                  </h4>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
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
                
                {note.content && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-3 leading-relaxed">
                    {note.content}
                  </p>
                )}
                
                <div className="text-xs text-gray-400">
                  {formatDate(note.created_at)}
                  {note.updated_at !== note.created_at && (
                    <span className="ml-1">(edited)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
