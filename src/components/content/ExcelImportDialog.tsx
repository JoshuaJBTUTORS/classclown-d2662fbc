import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { importExcelToCalendar } from '@/utils/excelImporter';

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExcelImportDialog({ open, onOpenChange, onSuccess }: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx')) {
        setMessage('Please select an Excel file (.xlsx)');
        return;
      }
      setFile(selectedFile);
      setResult(null);
      setMessage('');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setMessage('Starting import...');
    setResult(null);

    const importResult = await importExcelToCalendar(
      file,
      (prog, msg) => {
        setProgress(prog);
        setMessage(msg);
      }
    );

    setResult(importResult);
    setImporting(false);

    if (importResult.errors.length === 0) {
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        // Reset state
        setFile(null);
        setProgress(0);
        setMessage('');
        setResult(null);
      }, 2000);
    }
  };

  const handleClose = () => {
    if (!importing) {
      onOpenChange(false);
      // Reset state
      setFile(null);
      setProgress(0);
      setMessage('');
      setResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Content Calendar</DialogTitle>
          <DialogDescription className="space-y-2">
            <p>Upload your Excel file with content calendar data.</p>
            <div className="text-sm space-y-1">
              <p className="font-semibold">Expected format:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Sheet 1 (Main Content):</strong> Tutor videos - Columns: Month, Video title, Hook, Summary (Talking points), Status</li>
                <li><strong>Sheet 2 (Founder Videos):</strong> Founder content - Same columns as above</li>
                <li>Typically covers <strong>3 months</strong> (~84 tutor videos + 5 founder videos)</li>
                <li>Week numbers and video positions calculated automatically (7 videos per week)</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!result && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="hidden"
                id="excel-upload"
                disabled={importing}
              />
              <label
                htmlFor="excel-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {file ? (
                  <>
                    <FileSpreadsheet className="h-12 w-12 text-primary" />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Click to choose a different file
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload Excel file</p>
                    <p className="text-xs text-muted-foreground">
                      .xlsx format only
                    </p>
                  </>
                )}
              </label>
            </div>
          )}

          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">{message}</p>
            </div>
          )}

          {result && (
            <div className="space-y-2">
              {result.success > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Successfully imported {result.success} calendar entries!
                  </AlertDescription>
                </Alert>
              )}
              
              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">
                      {result.errors.length} error(s) occurred:
                    </p>
                    <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
                      {result.errors.slice(0, 10).map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                      {result.errors.length > 10 && (
                        <li>... and {result.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
            >
              {importing ? 'Importing...' : 'Import Calendar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
