import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AddLessonForm from '@/components/lessons/AddLessonForm';
import EditLessonForm from '@/components/lessons/EditLessonForm';
import CompleteSessionDialog from '@/components/lessons/CompleteSessionDialog';
import VideoConferenceLink from '@/components/lessons/VideoConferenceLink';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: string;
  subject?: string;
  lesson_type?: string;
  tutor_id: string;
  is_group: boolean;
  attendance_completed?: boolean;
  tutors?: {
    first_name: string;
    last_name: string;
  };
  lesson_students?: Array<{
    students: {
      first_name: string;
      last_name: string;
    };
  }>;
}

const Lessons = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  
  // Responsive sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  const { isAdmin, isOwner, isTutor, isParent } = useAuth();

  // Only admin, owner, and tutors can create lessons
  const canCreateLessons = isAdmin || isOwner || isTutor;

  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (!isDesktop && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          tutors (
            first_name,
            last_name
          ),
          lesson_students (
            students (
              first_name,
              last_name
            )
          )
        `)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching lessons:', error);
        toast.error('Failed to fetch lessons');
        return;
      }

      setLessons(data || []);
      setFilteredLessons(data || []);
    } catch (error) {
      console.error('Error in fetchLessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLessons(lessons);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = lessons.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(query) ||
          lesson.subject?.toLowerCase().includes(query) ||
          `${lesson.tutors?.first_name} ${lesson.tutors?.last_name}`.toLowerCase().includes(query)
      );
      setFilteredLessons(filtered);
    }
  }, [searchQuery, lessons]);

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsEditDialogOpen(true);
  };

  const handleCompleteSession = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsCompleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { variant: 'secondary' as const, label: 'Scheduled' },
      in_progress: { variant: 'default' as const, label: 'In Progress' },
      completed: { variant: 'outline' as const, label: 'Completed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300 w-full",
        "lg:ml-0",
        sidebarOpen && "lg:ml-64"
      )}>
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6">
            <PageTitle 
              title="Lessons" 
              subtitle="Manage and track lesson sessions"
              className="mb-4 md:mb-0"
            />
            {canCreateLessons && (
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Lesson
              </Button>
            )}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>All Lessons</CardTitle>
                  <CardDescription>
                    {isParent ? "View your children's lessons" : "Overview of all scheduled lessons"}
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search lessons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading lessons...</div>
              ) : filteredLessons.length === 0 ? (
                <div className="text-center py-8">
                  {searchQuery ? 'No lessons found matching your search.' : 'No lessons found.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden md:table-cell">Subject</TableHead>
                        <TableHead className="hidden md:table-cell">Tutor</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLessons.map((lesson) => (
                        <TableRow key={lesson.id}>
                          <TableCell>
                            <div className="font-medium">{lesson.title}</div>
                            {lesson.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {lesson.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {lesson.subject || 'Not specified'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {lesson.tutors ? 
                              `${lesson.tutors.first_name} ${lesson.tutors.last_name}` : 
                              'Not assigned'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDateTime(lesson.start_time)}</div>
                              <div className="text-gray-500">
                                to {new Date(lesson.end_time).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(lesson.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <VideoConferenceLink lesson={lesson} />
                              {canCreateLessons && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditLesson(lesson)}
                                  >
                                    Edit
                                  </Button>
                                  {lesson.status === 'scheduled' && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleCompleteSession(lesson)}
                                    >
                                      Complete
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {canCreateLessons && (
            <>
              <AddLessonForm
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onSuccess={() => {
                  setIsAddDialogOpen(false);
                  fetchLessons();
                }}
              />

              <EditLessonForm
                lesson={selectedLesson}
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  fetchLessons();
                }}
              />

              <CompleteSessionDialog
                lesson={selectedLesson}
                isOpen={isCompleteDialogOpen}
                onClose={() => setIsCompleteDialogOpen(false)}
                onSuccess={() => {
                  setIsCompleteDialogOpen(false);
                  fetchLessons();
                }}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Lessons;
