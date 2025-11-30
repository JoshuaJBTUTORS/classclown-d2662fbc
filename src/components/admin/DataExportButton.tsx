import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ExportResult {
  exportedAt: string;
  version: string;
  totalRows: number;
  totalTables: number;
  counts: Record<string, number>;
  errors: Array<{ table: string; error: string }>;
}

const DataExportButton: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<ExportResult | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setLastExport(null);
    
    try {
      toast.info('Starting data export...', { duration: 3000 });
      
      const { data, error } = await supabase.functions.invoke('export-heycleo-data');
      
      if (error) {
        console.error('Export error:', error);
        throw new Error(error.message || 'Export failed');
      }
      
      if (!data || !data.tables) {
        throw new Error('Invalid export response');
      }

      // Store export summary
      setLastExport({
        exportedAt: data.exportedAt,
        version: data.version,
        totalRows: data.totalRows,
        totalTables: data.totalTables,
        counts: data.counts,
        errors: data.errors || [],
      });

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `heycleo-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${data.totalRows} rows from ${data.totalTables} tables!`);
      
    } catch (err: any) {
      console.error('Export failed:', err);
      toast.error(err.message || 'Export failed. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          HeyCleo Data Export
        </CardTitle>
        <CardDescription>
          Export all HeyCleo data to a JSON file for migration to a new project.
          This includes users, conversations, courses, lesson plans, and more.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          size="lg"
          className="w-full"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting Data...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export All HeyCleo Data
            </>
          )}
        </Button>

        {lastExport && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Export Successful</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Total Rows:</span>
                <span className="ml-2 font-medium">{lastExport.totalRows.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tables:</span>
                <span className="ml-2 font-medium">{lastExport.totalTables}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Exported At:</span>
                <span className="ml-2 font-medium">
                  {new Date(lastExport.exportedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {lastExport.errors.length > 0 && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <div className="flex items-center gap-1 text-yellow-700 font-medium mb-1">
                  <AlertCircle className="h-3 w-3" />
                  Some tables had issues:
                </div>
                <ul className="text-yellow-600 text-xs space-y-1">
                  {lastExport.errors.map((err, i) => (
                    <li key={i}>{err.table}: {err.error}</li>
                  ))}
                </ul>
              </div>
            )}

            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View table counts
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                {Object.entries(lastExport.counts)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .map(([table, count]) => (
                    <div key={table} className="flex justify-between">
                      <span className="text-muted-foreground">{table}:</span>
                      <span>{(count as number).toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </details>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Exported Tables:</p>
          <p>profiles, user_roles, subjects, courses, course_modules, course_lessons, 
          cleo_conversations, cleo_messages, cleo_lesson_plans, voice_session_quotas, 
          platform_subscriptions, ai_assessments, and more...</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExportButton;
