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
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">{validParents}</div>
          <div className="text-sm text-green-600">Valid Parents</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">{validStudents}</div>
          <div className="text-sm text-blue-600">Valid Students</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-lg font-bold text-red-600">{totalErrors}</div>
          <div className="text-sm text-red-600">Total Errors</div>
        </div>
      </div>

      {totalErrors > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Found {totalErrors} validation errors. Please review and fix before importing.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="parents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="parents">
            Parents ({data.parents.length})
          </TabsTrigger>
          <TabsTrigger value="students">
            Students ({data.students.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parents" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
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
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
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
                          <Badge key={errorIndex} variant="destructive" className="text-xs">
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
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
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
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
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
                          <Badge key={errorIndex} variant="destructive" className="text-xs">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};