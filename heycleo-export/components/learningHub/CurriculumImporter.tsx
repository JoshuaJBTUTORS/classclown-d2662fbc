import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { learningHubService } from '@/services/learningHubService';
import { 
  parseCurriculumCsv, 
  downloadCurriculumCsvTemplate,
  ParsedCurriculumData 
} from '@/utils/curriculumCsvParser';
import { FileUp, Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CurriculumImporterProps {
  courseId: string;
  onImportComplete?: () => void;
}

export function CurriculumImporter({ courseId, onImportComplete }: CurriculumImporterProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCurriculumData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    modulesCreated: number;
    lessonsCreated: number;
  } | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setParseError('Please upload a CSV file');
      return;
    }

    setCsvFile(file);
    setParseError(null);
    setParsedData(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const parsed = parseCurriculumCsv(text);
      setParsedData(parsed);
      
      toast({
        title: "CSV Parsed Successfully",
        description: `Found ${parsed.modules.length} modules with ${parsed.modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV';
      setParseError(errorMessage);
      toast({
        title: "Parse Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await learningHubService.bulkCreateModulesAndLessons(courseId, parsedData);
      
      setImportResult({
        success: true,
        modulesCreated: result.modulesCreated,
        lessonsCreated: result.lessonsCreated,
      });

      toast({
        title: "Import Successful",
        description: `Created ${result.modulesCreated} modules and ${result.lessonsCreated} lessons`,
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });

      // Reset form
      setCsvFile(null);
      setParsedData(null);

      // Notify parent if callback provided
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import curriculum';
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setImportResult({
        success: false,
        modulesCreated: 0,
        lessonsCreated: 0,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const totalLessons = parsedData?.modules.reduce((sum, m) => sum + m.lessons.length, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Import Curriculum from CSV</h3>
        <p className="text-sm text-muted-foreground">
          Upload a CSV file to bulk-create modules and lessons for this course. All lessons will be configured for Cleo's interactive learning.
        </p>
      </div>

      {/* Download Template */}
      <Card className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium mb-1">Download CSV Template</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Start with our template to see the required format and example data.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCurriculumCsvTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
        </div>
      </Card>

      {/* File Upload */}
      <Card className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileUp className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium mb-1">Upload Curriculum CSV</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Select your prepared CSV file to import.
            </p>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isImporting}
            />
            {csvFile && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {csvFile.name}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Parse Error */}
      {parseError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      )}

      {/* Preview */}
      {parsedData && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Preview</h4>
                <p className="text-sm text-muted-foreground">
                  {parsedData.modules.length} modules, {totalLessons} lessons
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>

            <div className="space-y-2">
              {parsedData.modules.map((module, idx) => (
                <Collapsible key={idx}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-accent transition-colors">
                    <div className="text-left">
                      <div className="font-medium">
                        {module.order}. {module.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {module.lessons.length} lessons
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 ml-6 space-y-1">
                    {module.lessons.map((lesson, lessonIdx) => (
                      <div
                        key={lessonIdx}
                        className="p-2 rounded border-l-2 border-primary/20 bg-muted/30"
                      >
                        <div className="font-medium text-sm">
                          {lesson.order}. {lesson.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {lesson.objectives.length} learning objectives
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Alert variant={importResult.success ? "default" : "destructive"}>
          {importResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {importResult.success
              ? `Successfully created ${importResult.modulesCreated} modules and ${importResult.lessonsCreated} lessons`
              : 'Import failed. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Import Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleImport}
          disabled={!parsedData || isImporting}
          size="lg"
        >
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <FileUp className="h-4 w-4 mr-2" />
              Import to Course
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
