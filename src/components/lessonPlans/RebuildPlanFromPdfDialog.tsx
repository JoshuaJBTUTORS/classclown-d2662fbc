import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Wand2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RebuildPlanFromPdfDialogProps {
  subject: string;
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

const MAX_BYTES = 15 * 1024 * 1024;

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });

export const RebuildPlanFromPdfDialog: React.FC<RebuildPlanFromPdfDialogProps> = ({
  subject,
  isOpen,
  onClose,
  onCompleted,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [changes, setChanges] = useState<string[] | null>(null);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== 'application/pdf') {
      toast.error('Please choose a PDF file');
      return;
    }
    if (selected.size > MAX_BYTES) {
      toast.error('PDF must be under 15MB');
      return;
    }
    setChanges(null);
    setFile(selected);
  };

  const handleRebuild = async () => {
    if (!file) return;
    setIsRunning(true);
    setChanges(null);
    try {
      const pdfBase64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke('rebuild-lesson-plan-from-pdf', {
        body: { subject, pdfBase64, filename: file.name },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(
        `Plan rebuilt: ${data.updated} updated, ${data.inserted} added, ${data.deleted} removed`
      );
      setChanges(Array.isArray(data.changes) ? data.changes : []);
      onCompleted();
    } catch (err) {
      console.error('Rebuild failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to rebuild the lesson plan');
    } finally {
      setIsRunning(false);
    }
  };

  const handleClose = () => {
    if (isRunning) return;
    setFile(null);
    setChanges(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Rebuild {subject} from PDF
          </DialogTitle>
          <DialogDescription>
            Upload the official scheme of work. The AI compares it with the current weekly plan, removes weeks
            without a clear learning outcome, rewords anything that can't be taught online, and sets assessment
            weeks 9, 22, 35 and 48. Changes are applied immediately.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleSelect}
        />

        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={isRunning}>
          <Upload className="h-4 w-4 mr-2" />
          {file ? 'Choose a different PDF' : 'Choose PDF'}
        </Button>

        {file && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="truncate">{file.name}</span>
          </div>
        )}

        <Alert>
          <AlertDescription className="text-xs">
            This overwrites the current weeks for {subject} and cannot be undone. It usually takes 1-3 minutes.
          </AlertDescription>
        </Alert>

        {changes && changes.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded-md border p-3 text-sm space-y-1">
            <p className="font-medium">Changes made</p>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              {changes.map((change, i) => (
                <li key={i}>{change}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={isRunning}>
            Close
          </Button>
          <Button onClick={handleRebuild} disabled={!file || isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rebuilding...
              </>
            ) : (
              'Rebuild plan'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RebuildPlanFromPdfDialog;
