import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, GraduationCap, Search, Send } from 'lucide-react';
import { useStudentData } from '@/hooks/useStudentData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Monday 00:00 of London week containing d.
function londonMondayOf(d: Date): Date {
  const london = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  const day = london.getDay();
  const diffToMonday = (day + 6) % 7;
  london.setHours(0, 0, 0, 0);
  london.setDate(london.getDate() - diffToMonday);
  return london;
}
function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const StudentsList: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { students, isLoading } = useStudentData();
  const { userRole } = useAuth();
  const canSync = userRole === 'owner' || userRole === 'admin';
  const [syncWeek, setSyncWeek] = useState<'previous' | 'current'>('previous');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const thisMonday = londonMondayOf(new Date());
      const target = new Date(thisMonday);
      if (syncWeek === 'previous') target.setDate(target.getDate() - 7);
      const week_start = toIsoDate(target);

      const { data, error } = await supabase.functions.invoke('weekly-homework-sync', {
        body: { week_start },
      });
      if (error) throw error;
      const sent = (data as any)?.sent ?? 0;
      const failed = (data as any)?.failed ?? 0;
      const skipped = (data as any)?.skipped ?? 0;
      toast.success(`HeyCleo sync — sent ${sent}, failed ${failed}, skipped ${skipped}`);
    } catch (err: any) {
      console.error('Weekly homework sync failed', err);
      toast.error(err?.message || 'Failed to sync weekly homework');
    } finally {
      setIsSyncing(false);
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredStudents = q
    ? students.filter((s) => {
        const name = `${s.first_name ?? ''} ${s.last_name ?? ''}`.toLowerCase();
        return (
          name.includes(q) ||
          (s.email ?? '').toLowerCase().includes(q) ||
          (s.phone ?? '').toLowerCase().includes(q) ||
          (s.grade ?? '').toLowerCase().includes(q)
        );
      })
    : students;

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
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  All Students {students.length > 0 && `(${filteredStudents.length}/${students.length})`}
                </CardTitle>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
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
                ) : filteredStudents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    No students match "{searchQuery}".
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
                      {filteredStudents.map((s) => (
                        <TableRow
                          key={s.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/students-list/${s.id}`)}
                        >
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
