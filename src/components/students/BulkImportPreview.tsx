import React from 'react';
import { ImportPreviewData } from '@/types/bulkImport';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface BulkImportPreviewProps {
  data: ImportPreviewData;
}

export const BulkImportPreview: React.FC<BulkImportPreviewProps> = ({ data }) => {
  const validParents = data.parents.filter(p => p.isValid).length;
  const validStudents = data.students.filter(s => s.isValid).length;
  const totalErrors = data.parents.reduce((acc, p) => acc + p.errors.length, 0) +
                     data.students.reduce((acc, s) => acc + s.errors.length, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-[var(--radius-soft)] bg-pastel-mint text-pastel-mint-foreground">
          <div className="text-lg font-heading font-extrabold">{validParents}</div>
          <div className="text-sm">Valid Parents</div>
        </div>
        <div className="text-center p-3 rounded-[var(--radius-soft)] bg-pastel-sky text-pastel-sky-foreground">
          <div className="text-lg font-heading font-extrabold">{validStudents}</div>
          <div className="text-sm">Valid Students</div>
        </div>
        <div className="text-center p-3 rounded-[var(--radius-soft)] bg-pastel-blush text-pastel-blush-foreground">
          <div className="text-lg font-heading font-extrabold">{totalErrors}</div>
          <div className="text-sm">Total Errors</div>
        </div>
      </div>

      {totalErrors > 0 && (
        <Alert className="rounded-[var(--radius-soft)] border-0 bg-pastel-blush text-pastel-blush-foreground">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Found {totalErrors} validation errors. Please review and fix before importing.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="parents" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-full">
          <TabsTrigger value="parents" className="rounded-full">
            Parents ({data.parents.length})
          </TabsTrigger>
          <TabsTrigger value="students" className="rounded-full">
            Students ({data.students.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parents" className="space-y-4">
          <div className="rounded-[var(--radius-soft)] bg-pastel-sand shadow-[var(--shadow-soft)] p-2 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-0">
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.parents.map((parent, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {parent.isValid ? (
                        <CheckCircle className="h-4 w-4 text-foreground" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell>
                      {parent.first_name} {parent.last_name}
                    </TableCell>
                    <TableCell>{parent.email}</TableCell>
                    <TableCell>{parent.phone || '-'}</TableCell>
                    <TableCell>
                      {parent.errors.length > 0 && (
                        <div className="space-y-1">
                          {parent.errors.map((error, errorIndex) => (
                            <Badge key={errorIndex} className="text-xs rounded-full bg-pastel-blush text-pastel-blush-foreground border-0">
                              {error.field}: {error.message}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="rounded-[var(--radius-soft)] bg-pastel-sand shadow-[var(--shadow-soft)] p-2 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-0">
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Parent Email</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.students.map((student, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {student.isValid ? (
                        <CheckCircle className="h-4 w-4 text-foreground" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell>
                      {student.first_name} {student.last_name}
                    </TableCell>
                    <TableCell>{student.email || '-'}</TableCell>
                    <TableCell>{student.parent_email}</TableCell>
                    <TableCell>{student.grade || '-'}</TableCell>
                    <TableCell>
                      {student.errors.length > 0 && (
                        <div className="space-y-1">
                          {student.errors.map((error, errorIndex) => (
                            <Badge key={errorIndex} className="text-xs rounded-full bg-pastel-blush text-pastel-blush-foreground border-0">
                              {error.field}: {error.message}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
