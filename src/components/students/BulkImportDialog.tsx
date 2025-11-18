import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BulkImportService } from '@/services/bulkImportService';
import { BulkImportData, ImportPreviewData, ImportResult } from '@/types/bulkImport';
import { BulkImportPreview } from './BulkImportPreview';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BulkImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkImportDialog: React.FC<BulkImportDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<BulkImportData | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [duplicates, setDuplicates] = useState<string[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    setFile(selectedFile);
    
    try {
      const data = await BulkImportService.parseExcelFile(selectedFile);
      setImportData(data);
      
      // Validate data
      const validated = BulkImportService.validateData(data);
      setPreviewData(validated);
      
      // Check for duplicates
      const duplicatesList = await BulkImportService.checkForDuplicates(data);
      setDuplicates(duplicatesList);
      
      setStep('preview');
      toast.success('File uploaded and validated successfully');
    } catch (error) {
      toast.error(`Failed to parse file: ${error}`);
    }
  };

  const handleImport = async () => {
    if (!importData) return;
    
    setStep('importing');
    setImportProgress(0);
    
    try {
      const result = await BulkImportService.importData(
        importData,
        (progress) => setImportProgress(progress)
      );
      
      setImportResult(result);
      setStep('complete');
      
      if (result.success) {
        toast.success(`Import completed! Created ${result.parentsCreated} parents and ${result.studentsCreated} students.`);
        onSuccess();
      } else {
        toast.error(`Import completed with errors. Check the error report for details.`);
      }
    } catch (error) {
      toast.error(`Import failed: ${error}`);
      setStep('preview');
    }
  };

  const handleDownloadTemplate = () => {
    BulkImportService.generateTemplate();
    toast.success('Template downloaded successfully');
  };

  const handleDownloadErrors = () => {
    if (importResult?.errors) {
      BulkImportService.generateErrorReport(importResult.errors);
      toast.success('Error report downloaded successfully');
    }
  };

  const resetDialog = () => {
    setStep('upload');
    setFile(null);
    setImportData(null);
    setPreviewData(null);
    setImportProgress(0);
    setImportResult(null);
    setDuplicates([]);
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const canProceedWithImport = previewData && 
    previewData.parents.some(p => p.isValid) && 
    previewData.students.some(s => s.isValid);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Clients</DialogTitle>
          <DialogDescription>
            Import multiple parents and students from an Excel file
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Upload Excel File</h3>
                  <p className="text-sm text-muted-foreground">
                    Select an Excel file with "Parents" and "Students" sheets
                  </p>
                </div>
                <div className="mt-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild className="cursor-pointer">
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Template Requirements:</strong>
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                  <li>Excel file must contain "Parents" and "Students" sheets</li>
                  <li>Parents sheet: first_name, last_name, email (required), phone, billing_address, emergency contacts</li>
                  <li>Students sheet: first_name, last_name, parent_email (required), email, phone, grade, subjects, notes</li>
                  <li>parent_email in Students sheet must match email in Parents sheet</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 'preview' && previewData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Import Preview</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Back
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={!canProceedWithImport}
                >
                  Proceed with Import
                </Button>
              </div>
            </div>

            {duplicates.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Duplicates Found:</strong>
                  <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                    {duplicates.map((duplicate, index) => (
                      <li key={index}>{duplicate}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <BulkImportPreview data={previewData} />
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-6 text-center">
            <div>
              <h3 className="text-lg font-medium mb-4">Importing Data...</h3>
              <Progress value={importProgress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                {importProgress}% complete
              </p>
            </div>
          </div>
        )}

        {step === 'complete' && importResult && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-medium">Import Complete</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.parentsCreated}
                </div>
                <div className="text-sm text-green-600">Parents Created</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.studentsCreated}
                </div>
                <div className="text-sm text-blue-600">Students Created</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {importResult.authAccountsCreated || 0}
                </div>
                <div className="text-sm text-purple-600">Login Accounts</div>
              </div>
            </div>

            {(importResult.authAccountsCreated || 0) > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Login accounts created successfully!</strong> 
                  <br />Default password: <code className="bg-gray-100 px-1 rounded">classbeyond123!</code>
                  <br />Users should change their passwords after first login.
                </AlertDescription>
              </Alert>
            )}

            {importResult.errors.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>
                      <strong>{importResult.errors.length} errors occurred during import.</strong>
                    </span>
                    <Button size="sm" variant="outline" onClick={handleDownloadErrors}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Error Report
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center">
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};