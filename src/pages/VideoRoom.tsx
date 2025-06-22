
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVideoRoom } from '@/hooks/useVideoRoom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Video, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import EmbeddedVideoRoom from '@/components/video/EmbeddedVideoRoom';

const VideoRoom: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { userRole, isAdmin, isOwner, isTutor } = useAuth();
  
  const {
    lesson,
    isLoading,
    error,
    handleLeaveRoom
  } = useVideoRoom(lessonId || '');

  // Determine if user has teacher/host privileges
  const isTeacherRole = isTutor || isAdmin || isOwner;

  // Get the appropriate room URL based on role
  const getRoomUrl = () => {
    if (!lesson) return null;
    
    if (isTeacherRole) {
      // Teachers get the authenticated room URL
      return lesson.lesson_space_room_url;
    } else {
      // Students and parents get the invitation URL using room ID
      return lesson.lesson_space_room_id 
        ? `https://www.thelessonspace.com/space/${lesson.lesson_space_room_id}`
        : null;
    }
  };

  const roomUrl = getRoomUrl();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading lesson details...</p>
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
