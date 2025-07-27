
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useParticipantUrl } from '@/hooks/useParticipantUrl';
import { useVideoRoom } from '@/hooks/useVideoRoom';
import EmbeddedVideoRoom from '@/components/video/EmbeddedVideoRoom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle, Video } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function VideoRoom() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  const {
    lesson,
    expectedStudents,
    isLoading: lessonLoading,
    error: lessonError,
    videoRoomRole,
    handleRetry,
    handleLeaveRoom,
    getDisplayName,
  } = useVideoRoom(lessonId || '');

  // Get pre-generated participant URL
  const {
    participantUrl,
    isLoading: urlLoading,
    error: urlError
  } = useParticipantUrl(lessonId || '');

  // Memoize the final states to prevent unnecessary re-renders
  const isLoading = useMemo(() => lessonLoading || urlLoading, [lessonLoading, urlLoading]);
  const error = useMemo(() => lessonError || urlError, [lessonError, urlError]);
  
  // Memoize the participant URL to prevent iframe refresh on re-renders
  const stableParticipantUrl = useMemo(() => participantUrl, [participantUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">
            Loading lesson details...
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

  if (!stableParticipantUrl) {
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
                {videoRoomRole === 'tutor' 
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
        roomUrl={stableParticipantUrl}
        spaceId={lesson?.lesson_space_space_id}
        lessonTitle={lesson?.title}
        onExit={handleLeaveRoom}
        className="h-screen"
      />
    </div>
  );
};
