
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LessonConsentDialog from './LessonConsentDialog';
import { 
  Video,
  Users,
  Loader2,
  ExternalLink,
  Play,
  UserCheck
} from 'lucide-react';

interface VideoConferenceLinkProps {
  lessonId: string;
  lessonSpaceRoomUrl?: string | null;
  lessonSpaceRoomId?: string | null;
  lessonSpaceSpaceId?: string | null;
  className?: string;
  isGroupLesson?: boolean;
  studentCount?: number;
}

const VideoConferenceLink: React.FC<VideoConferenceLinkProps> = ({
  lessonId,
  lessonSpaceRoomUrl,
  lessonSpaceRoomId,
  lessonSpaceSpaceId,
  className = "",
  isGroupLesson = false,
  studentCount = 0
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [lessonData, setLessonData] = useState<any>(null);
  const [studentName, setStudentName] = useState('');
  const navigate = useNavigate();
  const { userRole, isAdmin, isOwner, isTutor, user } = useAuth();

  // Determine if user has teacher/host privileges
  const isTeacherRole = isTutor || isAdmin || isOwner;

  // Get the appropriate URL based on user role
  const getVideoRoomUrl = () => {
    if (isTeacherRole) {
      // Teachers get the authenticated room URL with full controls
      return lessonSpaceRoomUrl;
    } else {
      // Students and parents get the simple invitation URL using room ID
      return lessonSpaceRoomId ? `https://www.thelessonspace.com/space/${lessonSpaceRoomId}` : null;
    }
  };

  const videoUrl = getVideoRoomUrl();

  const fetchLessonDataAndStudentName = async () => {
    try {
      // Fetch lesson data
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(first_name, last_name),
          lesson_students(*)
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;

      // Fetch student name based on user role
      let studentDisplayName = '';
      if (userRole === 'student') {
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('first_name, last_name')
          .eq('user_id', user?.id)
          .single();

        if (!studentError && student) {
          studentDisplayName = `${student.first_name} ${student.last_name}`.trim();
        }
      } else if (userRole === 'parent') {
        // For parents, we need to find which student they're joining for
        const { data: parent, error: parentError } = await supabase
          .from('parents')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (!parentError && parent) {
          const { data: studentInLesson, error: studentError } = await supabase
            .from('lesson_students')
            .select(`
              student:students(first_name, last_name, parent_id)
            `)
            .eq('lesson_id', lessonId);

          if (!studentError && studentInLesson) {
            const parentChild = studentInLesson.find(
              ls => ls.student?.parent_id === parent.id
            );
            if (parentChild?.student) {
              studentDisplayName = `${parentChild.student.first_name} ${parentChild.student.last_name}`.trim();
            }
          }
        }
      }

      setLessonData(lesson);
      setStudentName(studentDisplayName || 'Student');
    } catch (error) {
      console.error('Error fetching lesson data:', error);
      toast.error('Failed to load lesson details');
    }
  };

  const handleJoinRoom = async () => {
    if (!videoUrl) {
      toast.error('Video room URL not available');
      return;
    }

    // Teachers can join directly without consent dialog
    if (isTeacherRole) {
      try {
        setIsLoading(true);
        navigate(`/video-room/${lessonId}`);
        toast.success('Loading video room...');
      } catch (error) {
        console.error('Error navigating to video room:', error);
        toast.error('Failed to open video room');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // For students and parents, show consent dialog first
    setIsLoading(true);
    await fetchLessonDataAndStudentName();
    setIsLoading(false);
    setShowConsentDialog(true);
  };

  const handleConsentAccept = () => {
    setShowConsentDialog(false);
    navigate(`/video-room/${lessonId}`);
    toast.success('Joining lesson...');
  };

  const handleConsentClose = () => {
    setShowConsentDialog(false);
  };

  const handleOpenInNewTab = () => {
    if (!videoUrl) {
      toast.error('Video room URL not available');
      return;
    }

    try {
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
      toast.success('Opening video room in new tab...');
    } catch (error) {
      console.error('Error opening video room:', error);
      toast.error('Failed to open video room');
    }
  };

  if (!lessonSpaceRoomId && !lessonSpaceRoomUrl) {
    return null;
  }

  return (
    <>
      <div className={`${className} flex items-center justify-between border rounded-lg p-4 bg-gray-50`}>
        <div>
          <h3 className="font-medium text-sm">LessonSpace Video Room</h3>
          <p className="text-sm text-muted-foreground">
            {isTeacherRole ? 'Manage your interactive video classroom' : 'Join your interactive video classroom'}
          </p>
          {isGroupLesson && (
            <p className="text-xs text-muted-foreground mt-1">
              <Users className="h-3 w-3 inline-block mr-1" />
              Group lesson ({studentCount} students)
            </p>
          )}
          {isTeacherRole && lessonSpaceRoomId && (
            <p className="text-xs text-muted-foreground mt-1">
              Room ID: {lessonSpaceRoomId}
            </p>
          )}
          {lessonSpaceSpaceId && (
            <p className="text-xs text-muted-foreground mt-1">
              Space ID: {lessonSpaceSpaceId}
            </p>
          )}
          {!isTeacherRole && (
            <p className="text-xs text-green-600 mt-1">
              <UserCheck className="h-3 w-3 inline-block mr-1" />
              Student access - click to join
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenInNewTab}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-3 w-3" />
            New Tab
          </Button>
          
          <Button
            onClick={handleJoinRoom}
            disabled={isLoading}
            className={`flex items-center gap-2 ${
              isTeacherRole 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700'
            } text-white`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Video className="h-4 w-4" />
                <Play className="h-3 w-3" />
              </>
            )}
            {isTeacherRole ? 'Host Room' : 'Join Lesson'}
          </Button>
        </div>
      </div>

      {/* Consent Dialog for Students */}
      {showConsentDialog && lessonData && (
        <LessonConsentDialog
          isOpen={showConsentDialog}
          onClose={handleConsentClose}
          onAccept={handleConsentAccept}
          lesson={lessonData}
          studentName={studentName}
        />
      )}
    </>
  );
};

export default VideoConferenceLink;
