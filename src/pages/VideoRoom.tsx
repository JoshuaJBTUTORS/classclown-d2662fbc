
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { useVideoRoom } from '@/hooks/useVideoRoom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Video, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import EmbeddedVideoRoom from '@/components/video/EmbeddedVideoRoom';
import { useStudentJoin } from '@/hooks/useStudentJoin';
import { toast } from 'sonner';

const VideoRoom: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { userRole, isAdmin, isOwner, isTutor, user } = useAuth();
  const { joinLessonSpace, isJoining } = useStudentJoin();
  const [studentRoomUrl, setStudentRoomUrl] = useState<string | null>(null);
  
  const {
    lesson,
    isLoading,
    error,
    handleLeaveRoom
  } = useVideoRoom(lessonId || '');

  // Determine if user has teacher/host privileges
  const isTeacherRole = isTutor || isAdmin || isOwner;

  // Handle student joining via Launch API
  useEffect(() => {
    const handleStudentJoin = async () => {
      if (!lesson || !user || isTeacherRole || studentRoomUrl) return;
      
      try {
        let studentId: number;
        let studentName: string;

        if (userRole === 'student') {
          const { data: student } = await supabase.from('students')
            .select('id, first_name, last_name')
            .eq('email', user.email)
            .single();
          
          if (!student) return;
          studentId = student.id;
          studentName = `${student.first_name} ${student.last_name}`;
        } else if (userRole === 'parent') {
          // For parents, use the first child in the lesson
          const firstStudent = lesson.lesson_students?.[0]?.student;
          if (!firstStudent) return;
          
          studentId = firstStudent.id;
          studentName = `${firstStudent.first_name} ${firstStudent.last_name}`;
        } else {
          return;
        }

        const url = await joinLessonSpace(lessonId!, studentId, studentName);
        if (url) {
          setStudentRoomUrl(url);
        }
      } catch (error) {
        console.error('Error getting student Launch API URL:', error);
        toast.error('Failed to join lesson space');
      }
    };

    handleStudentJoin();
  }, [lesson, user, userRole, isTeacherRole, lessonId, joinLessonSpace, studentRoomUrl]);

  // Get the appropriate room URL based on role
  const getRoomUrl = () => {
    if (!lesson) return null;
    
    if (isTeacherRole) {
      // Teachers get the authenticated room URL
      return lesson.lesson_space_room_url;
    } else {
      // Students and parents get the Launch API URL
      return studentRoomUrl;
    }
  };

  const roomUrl = getRoomUrl();

  if (isLoading || isJoining) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">
            {isJoining ? 'Joining lesson space...' : 'Loading lesson details...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Unable to Access Video Room
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {error}
              </p>
            </div>
            <Button onClick={handleLeaveRoom} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!roomUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <Video className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                No Video Room Available
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {isTeacherRole 
                  ? "This lesson doesn't have a video room set up yet. Please create one first."
                  : "This lesson doesn't have a video room set up yet. Please contact your teacher to create one."
                }
              </p>
            </div>
            <Button onClick={handleLeaveRoom} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmbeddedVideoRoom
        roomUrl={roomUrl}
        spaceId={lesson?.lesson_space_space_id}
        lessonTitle={lesson?.title}
        onExit={handleLeaveRoom}
        className="h-screen"
      />
    </div>
  );
};

export default VideoRoom;
