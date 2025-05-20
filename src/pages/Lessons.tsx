
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar as CalendarIcon, 
  Download,
  Plus, 
  Search, 
  Users,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AddLessonForm from '@/components/lessons/AddLessonForm';
import LessonDetailsDialog from '@/components/calendar/LessonDetailsDialog';
import CompleteSessionDialog from '@/components/lessons/CompleteSessionDialog';
import { Lesson } from '@/types/lesson';

const Lessons = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isLessonDetailsOpen, setIsLessonDetailsOpen] = useState(false);
  const [isCompleteSessionOpen, setIsCompleteSessionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
  }, []);

  useEffect(() => {
    // Apply filters when lessons, search query or status filter changes
    filterLessons();
  }, [lessons, searchQuery, statusFilter]);

  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students!inner(
            student:students(id, first_name, last_name)
          )
        `)
        .order('start_time', { ascending: false });

      if (error) throw error;

      // Transform the data
      const processedData = data.map(lesson => {
        const students = lesson.lesson_students.map((ls: any) => ls.student);
        return {
          ...lesson,
          students,
          lesson_students: undefined
        };
      });

      setLessons(processedData);
      setFilteredLessons(processedData);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  const filterLessons = () => {
    let filtered = lessons;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lesson => 
        lesson.title.toLowerCase().includes(query) ||
        lesson.tutor?.first_name.toLowerCase().includes(query) ||
        lesson.tutor?.last_name.toLowerCase().includes(query) ||
        lesson.students?.some(student => 
          student.first_name.toLowerCase().includes(query) ||
          student.last_name.toLowerCase().includes(query)
        )
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lesson => lesson.status === statusFilter);
    }

    setFilteredLessons(filtered);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleAddLessonSuccess = () => {
    fetchLessons();
    toast.success('Lesson added successfully!');
  };

  const handleCompleteSessionSuccess = () => {
    fetchLessons();
    toast.success('Session completed successfully!');
  };

  const viewLessonDetails = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setIsLessonDetailsOpen(true);
  };

  const openCompleteSession = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setIsCompleteSessionOpen(true);
  };

  const formatDateTime = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 lg:pl-64">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <PageTitle 
              title="Lessons" 
              subtitle="Manage all tuition sessions"
              className="mb-4 md:mb-0"
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button className="flex items-center gap-2" onClick={() => setIsAddingLesson(true)}>
                <Plus className="h-4 w-4" />
                New Lesson
              </Button>
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle>Lesson Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search lessons, tutors, or students..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-full sm:w-[180px]">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Lesson</TableHead>
                      <TableHead>Tutor</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Loading lessons...
                        </TableCell>
                      </TableRow>
                    ) : filteredLessons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No lessons found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLessons.map((lesson) => (
                        <TableRow key={lesson.id}>
                          <TableCell className="font-medium">{lesson.title}</TableCell>
                          <TableCell>
                            {lesson.tutor?.first_name} {lesson.tutor?.last_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{lesson.students?.length || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDateTime(lesson.start_time)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                lesson.status === 'scheduled' ? 'outline' :
                                lesson.status === 'completed' ? 'default' :
                                'destructive'
                              }
                              className={lesson.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                            >
                              {lesson.status === 'completed' && (
                                <Check className="mr-1 h-3 w-3" />
                              )}
                              {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary"
                              className="font-normal"
                            >
                              {lesson.is_group ? 'Group' : 'Individual'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {lesson.status !== 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                  onClick={() => openCompleteSession(lesson.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Complete
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewLessonDetails(lesson.id)}
                              >
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add Lesson Dialog */}
      <AddLessonForm 
        isOpen={isAddingLesson} 
        onClose={() => setIsAddingLesson(false)}
        onSuccess={handleAddLessonSuccess}
      />

      {/* Lesson Details Dialog */}
      <LessonDetailsDialog
        lessonId={selectedLessonId}
        isOpen={isLessonDetailsOpen}
        onClose={() => setIsLessonDetailsOpen(false)}
      />

      {/* Complete Session Dialog */}
      <CompleteSessionDialog
        lessonId={selectedLessonId}
        isOpen={isCompleteSessionOpen}
        onClose={() => setIsCompleteSessionOpen(false)}
        onSuccess={handleCompleteSessionSuccess}
      />
    </div>
  );
};

export default Lessons;
