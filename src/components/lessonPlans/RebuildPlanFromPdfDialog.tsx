import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

type KeyStage = 'ks2' | 'ks3' | 'gcse' | 'all';

const detectKeyStage = (subject: string): KeyStage => {
  const s = subject.toLowerCase();
  if (s.includes('gcse') || s.includes('year 10') || s.includes('year 11')) return 'gcse';
  if (s.includes('ks2') || s.includes('sats') || s.includes('11 plus')) return 'ks2';
  if (s.includes('ks3')) return 'ks3';
  return 'all';
};

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
  const [keyStage, setKeyStage] = useState<KeyStage>(detectKeyStage(subject));
  const [targetWeeks, setTargetWeeks] = useState<string>('52');
  const [isRunning, setIsRunning] = useState(false);
  const [changes, setChanges] = useState<string[] | null>(null);
  const [scope, setScope] = useState<{ years: number[]; units: number } | null>(null);


  useEffect(() => {
    setKeyStage(detectKeyStage(subject));
  }, [subject]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const name = selected.name.toLowerCase();
    const isPdf = selected.type === 'application/pdf' || name.endsWith('.pdf');
    const isDocx = selected.type === DOCX_MIME || name.endsWith('.docx');
    if (!isPdf && !isDocx) {
      toast.error('Please choose a PDF or Word (.docx) file');
      return;
    }
    if (selected.size > MAX_BYTES) {
      toast.error('File must be under 15MB');
      return;
    }
    setChanges(null);
    setScope(null);
    setFile(selected);
  };

  const handleRebuild = async () => {
    if (!file) return;
    setIsRunning(true);
    setChanges(null);
    setScope(null);
    try {
      const fileBase64 = await fileToBase64(file);
      const mimeType = file.name.toLowerCase().endsWith('.docx')
        ? DOCX_MIME
        : file.type || 'application/pdf';

      const { data, error } = await supabase.functions.invoke('rebuild-lesson-plan-from-pdf', {
        body: { subject, fileBase64, filename: file.name, mimeType, keyStage, targetWeeks: Number(targetWeeks) || 52 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(
        `Plan rebuilt: ${data.updated} updated, ${data.inserted} added, ${data.deleted} removed`
      );
      setChanges(Array.isArray(data.changes) ? data.changes : []);
      if (Array.isArray(data.detectedYears) && data.detectedYears.length > 0) {
        setScope({ years: data.detectedYears, units: data.unitCount || 0 });
      }
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
    setScope(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Rebuild {subject} from a curriculum document
          </DialogTitle>
          <DialogDescription>
            Upload the official curriculum plan (PDF or Word). The AI compares it with the current weekly plan,
            removes weeks without a clear learning outcome, rewords anything that can't be taught online, and sets
            assessment weeks 9, 22, 35 and 48. Changes are applied immediately.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf"
          className="hidden"
          onChange={handleSelect}
        />

        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={isRunning}>
          <Upload className="h-4 w-4 mr-2" />
          {file ? 'Choose a different file' : 'Choose PDF or Word document'}
        </Button>

        {file && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="truncate">{file.name}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm">Year groups to use from the document</Label>
          <Select value={keyStage} onValueChange={(v) => setKeyStage(v as KeyStage)} disabled={isRunning}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ks2">KS2 — Years 3, 4, 5 and 6</SelectItem>
              <SelectItem value="ks3">KS3 — Years 7, 8 and 9</SelectItem>
              <SelectItem value="gcse">GCSE — Years 10 and 11</SelectItem>
              <SelectItem value="all">Whole document</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Only applies to Word documents split into "Year N units" sections. Everything else uses the whole file.
          </p>
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            This overwrites the current weeks for {subject} and cannot be undone. It usually takes 1-3 minutes.
          </AlertDescription>
        </Alert>

        {scope && (
          <div className="rounded-md border p-3 text-sm">
            Used Year {scope.years.join(', ')}
            {scope.units > 0 ? ` — ${scope.units} units` : ''}
          </div>
        )}

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
