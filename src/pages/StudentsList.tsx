import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, GraduationCap } from 'lucide-react';
import { useStudentData } from '@/hooks/useStudentData';

const StudentsList: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { students, isLoading } = useStudentData();

  return (
    <div className="min-h-screen bg-background">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <PageTitle
              title="Students"
              subtitle="A simple list of all students"
            />

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  All Students {students.length > 0 && `(${students.length})`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : students.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    No students yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Year / Grade</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">
                            {s.first_name} {s.last_name}
                          </TableCell>
                          <TableCell>{s.email || '—'}</TableCell>
                          <TableCell>{s.phone || '—'}</TableCell>
                          <TableCell>{s.grade || '—'}</TableCell>
                          <TableCell>
                            <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>
                              {s.status || 'active'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsList;
