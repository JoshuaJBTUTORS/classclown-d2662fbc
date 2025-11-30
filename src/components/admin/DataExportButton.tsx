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
  const [isExporting, setIsExporting] = useState<number | null>(null);
  const [lastExport, setLastExport] = useState<ExportResult | null>(null);

  const handleExport = async (part: number) => {
    setIsExporting(part);
    setLastExport(null);
    
    try {
      toast.info(`Starting Part ${part} export...`, { duration: 3000 });
      
      const { data, error } = await supabase.functions.invoke('export-heycleo-data', {
        body: { part }
      });
      
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
      a.download = `heycleo-export-part${part}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Part ${part}: Exported ${data.totalRows} rows from ${data.totalTables} tables!`);
      
    } catch (err: any) {
      console.error('Export failed:', err);
      toast.error(err.message || 'Export failed. Check console for details.');
    } finally {
      setIsExporting(null);
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
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => handleExport(1)} 
            disabled={isExporting !== null}
            size="lg"
            className="w-full"
          >
            {isExporting === 1 ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Part 1: Core Data
              </>
            )}
          </Button>
          <Button 
            onClick={() => handleExport(2)} 
            disabled={isExporting !== null}
            size="lg"
            className="w-full"
          >
            {isExporting === 2 ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Part 2: Content
              </>
            )}
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground border rounded p-3 space-y-1">
          <p><strong>Part 1:</strong> profiles, user_roles, subjects, year_groups, exam_board_specs, gamification, subscriptions, settings</p>
          <p><strong>Part 2:</strong> courses, modules, lessons, lesson_plans, assessments, questions, responses</p>
        </div>

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
      </CardContent>
    </Card>
  );
};

export default DataExportButton;
