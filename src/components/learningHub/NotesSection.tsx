import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { learningHubService } from '@/services/learningHubService';
import { useToast } from '@/hooks/use-toast';
import { CourseNote } from '@/types/courseNotes';

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
  const [isCreating, setIsCreating] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [editNote, setEditNote] = useState({ title: '', content: '' });

  // Fetch notes
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['course-notes', courseId, lessonId],
    queryFn: () => learningHubService.getCourseNotes(courseId, lessonId),
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: learningHubService.createCourseNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-notes', courseId] });
      setIsCreating(false);
      setNewNote({ title: '', content: '' });
      toast({
        title: "Note created",
        description: "Your note has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating note",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, noteData }: { noteId: string; noteData: { title: string; content?: string } }) =>
      learningHubService.updateCourseNote(noteId, noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-notes', courseId] });
      setEditingNoteId(null);
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating note",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: learningHubService.deleteCourseNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-notes', courseId] });
      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting note",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleCreateNote = () => {
    if (!newNote.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note.",
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

  const handleEditNote = (note: CourseNote) => {
    setEditingNoteId(note.id);
    setEditNote({ title: note.title, content: note.content || '' });
  };

  const handleUpdateNote = () => {
    if (!editNote.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note.",
        variant: "destructive",
      });
      return;
    }

    updateNoteMutation.mutate({
      noteId: editingNoteId!,
      noteData: editNote,
    });
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
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
    <div className="h-full flex flex-col border rounded-lg bg-white">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-medium">Notes</h3>
          {lessonTitle && (
            <p className="text-sm text-gray-500 mt-1">For: {lessonTitle}</p>
          )}
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          size="sm"
          variant="outline"
          disabled={isCreating}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Note
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Create new note form */}
          {isCreating && (
            <div className="border rounded-lg p-3 bg-gray-50">
              <Input
                placeholder="Note title"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                className="mb-3"
              />
              <Textarea
                placeholder="Write your note here..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                className="mb-3"
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateNote}
                  size="sm"
                  disabled={createNoteMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setIsCreating(false);
                    setNewNote({ title: '', content: '' });
                  }}
                  size="sm"
                  variant="outline"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Existing notes */}
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No notes yet. Create your first note to get started!
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-3 bg-white">
                {editingNoteId === note.id ? (
                  // Edit mode
                  <div>
                    <Input
                      value={editNote.title}
                      onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
                      className="mb-3"
                    />
                    <Textarea
                      value={editNote.content}
                      onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
                      className="mb-3"
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpdateNote}
                        size="sm"
                        disabled={updateNoteMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        onClick={() => setEditingNoteId(null)}
                        size="sm"
                        variant="outline"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{note.title}</h4>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleEditNote(note)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteNote(note.id)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {note.content && (
                      <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                        {note.content}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatDate(note.created_at)}
                      {note.updated_at !== note.created_at && ' (edited)'}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default NotesSection;
