import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileUp, Trash2, Paperclip, Loader2 } from 'lucide-react';
import { useLessonResources, LessonResource } from '@/hooks/useLessonResources';

interface SubmitResourcesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  onSuccess?: () => void;
}

const formatSize = (bytes?: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const SubmitResourcesDialog: React.FC<SubmitResourcesDialogProps> = ({
  isOpen,
  onClose,
  lessonId,
  onSuccess,
}) => {
  const { resources, isLoading, isUploading, uploadResources, deleteResource } = useLessonResources(lessonId);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const ok = await uploadResources(selectedFiles, note);
    if (ok) {
      setSelectedFiles([]);
      setNote('');
      if (inputRef.current) inputRef.current.value = '';
      onSuccess?.();
    }
  };

  const handleDelete = async (resource: LessonResource) => {
    const ok = await deleteResource(resource);
    if (ok) onSuccess?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Submit Resources
          </DialogTitle>
          <DialogDescription>
            Upload the resources you used in this session. These are stored internally and are not shared with students or parents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resource-files">Files</Label>
            <input
              id="resource-files"
              ref={inputRef}
              type="file"
              multiple
              onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:text-primary-foreground hover:file:opacity-90"
            />
            {selectedFiles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ready to upload
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-note">Note (optional)</Label>
            <Textarea
              id="resource-note"
              placeholder="What did you use these resources for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[70px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Submitted resources</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : resources.length === 0 ? (
              <p className="text-sm text-muted-foreground">No resources submitted yet.</p>
            ) : (
              <div className="space-y-2">
                {resources.map((resource) => (
                  <div key={resource.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <Paperclip className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{resource.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatSize(resource.file_size)}
                          {resource.note ? ` • ${resource.note}` : ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => handleDelete(resource)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={isUploading || selectedFiles.length === 0}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading…
              </>
            ) : (
              'Save resources'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitResourcesDialog;
