import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TopicRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Lesson {
  id: string;
  title: string;
  start_time: string;
  subject?: string;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
}

export function TopicRequestDialog({ open, onOpenChange, onSuccess }: TopicRequestDialogProps) {
  const { toast } = useToast();
  const { user, userRole, profile, parentProfile } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [requestedTopic, setRequestedTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchUserLessons();
    }
  }, [open, user, userRole]);

  const fetchUserLessons = async () => {
    setLoadingData(true);
    try {
      let query = supabase
        .from('lessons')
        .select(`
          id,
          title,
          start_time,
          subject,
          lesson_students!inner(
            student_id,
            students!inner(
              id,
              first_name,
              last_name,
              parent_id
            )
          )
        `)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (userRole === 'student') {
        // Get current student ID
        const { data: currentStudent } = await supabase
          .from('students')
          .select('id')
          .eq('email', user.email)
          .single();

        if (currentStudent) {
          query = query.eq('lesson_students.student_id', currentStudent.id);
          setSelectedStudentId(currentStudent.id.toString());
        }
      } else if (userRole === 'parent') {
        // Get children's lessons
        const { data: parentData } = await supabase
          .from('parents')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (parentData) {
          query = query.eq('lesson_students.students.parent_id', parentData.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Extract unique lessons and students
      const lessonsMap = new Map();
      const studentsMap = new Map();

      data?.forEach((lesson: any) => {
        lessonsMap.set(lesson.id, {
          id: lesson.id,
          title: lesson.title,
          start_time: lesson.start_time,
          subject: lesson.subject
        });

        lesson.lesson_students.forEach((ls: any) => {
          const student = ls.students;
          studentsMap.set(student.id, {
            id: student.id,
            first_name: student.first_name,
            last_name: student.last_name
          });
        });
      });

      setLessons(Array.from(lessonsMap.values()));
      setStudents(Array.from(studentsMap.values()));

      // For students, auto-select if only one student
      if (userRole === 'student' && studentsMap.size === 1) {
        const studentId = Array.from(studentsMap.keys())[0];
        setSelectedStudentId(studentId.toString());
      }

    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: "Error",
        description: "Failed to load your lessons. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLessonId || !requestedTopic.trim() || !selectedStudentId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const requestData: any = {
        lesson_id: selectedLessonId,
        student_id: parseInt(selectedStudentId),
        requested_topic: requestedTopic.trim(),
        status: 'pending'
      };

      // Add parent_id if user is a parent
      if (userRole === 'parent' && parentProfile) {
        requestData.parent_id = parentProfile.id;
      }

      const { error } = await supabase
        .from('topic_requests')
        .insert(requestData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Topic request submitted successfully!",
      });

      // Reset form
      setSelectedLessonId('');
      setSelectedStudentId('');
      setRequestedTopic('');
      onOpenChange(false);
      onSuccess?.();

    } catch (error) {
      console.error('Error submitting topic request:', error);
      toast({
        title: "Error",
        description: "Failed to submit topic request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatLessonOption = (lesson: Lesson) => {
    const date = new Date(lesson.start_time).toLocaleDateString();
    const time = new Date(lesson.start_time).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${lesson.title} ${lesson.subject ? `(${lesson.subject})` : ''} - ${date} at ${time}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a Topic</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {userRole === 'parent' && students.length > 1 && (
            <div>
              <Label htmlFor="student-select">Select Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.first_name} {student.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="lesson-select">Select Lesson</Label>
            <Select value={selectedLessonId} onValueChange={setSelectedLessonId} disabled={loadingData}>
              <SelectTrigger>
                <SelectValue placeholder={loadingData ? "Loading lessons..." : "Select a lesson"} />
              </SelectTrigger>
              <SelectContent>
                {lessons.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    {formatLessonOption(lesson)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="topic-request">Requested Topic</Label>
            <Textarea
              id="topic-request"
              value={requestedTopic}
              onChange={(e) => setRequestedTopic(e.target.value)}
              placeholder="Describe the topic you'd like to cover in this lesson..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || loadingData || !selectedLessonId || !requestedTopic.trim() || !selectedStudentId}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}