
import React, { useEffect, useState } from 'react';
import { FlexibleClassroomCredentials } from '@/hooks/useFlexibleClassroom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Loader2, Users, Clock } from 'lucide-react';

interface SimpleFlexibleClassroomProps {
  credentials: FlexibleClassroomCredentials;
  onLeave: () => void;
  expectedStudents?: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
}

const SimpleFlexibleClassroom: React.FC<SimpleFlexibleClassroomProps> = ({
  credentials,
  onLeave,
  expectedStudents = []
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const generateClassroomUrl = () => {
    // Generate the Agora Flexible Classroom URL with parameters
    const baseUrl = 'https://solutions.agora.io/education/web';
    const params = new URLSearchParams({
      appId: credentials.appId,
      region: 'AP', // Asia Pacific
      roomUuid: credentials.roomId,
      userUuid: credentials.userUuid,
      userName: credentials.userName,
      roleType: credentials.userRole === 'teacher' ? '1' : '2',
      roomType: expectedStudents.length <= 1 ? '0' : '10', // 0 = 1v1, 10 = Cloud Class
      roomName: credentials.lessonTitle || `Lesson ${credentials.roomId}`,
      rtmToken: credentials.rtmToken,
      language: 'en',
      duration: '3600' // 1 hour
    });

    return `${baseUrl}?${params.toString()}`;
  };

  const handleJoinClassroom = () => {
    setIsRedirecting(true);
    const classroomUrl = generateClassroomUrl();
    
    console.log('Opening Flexible Classroom:', classroomUrl);
    
    // Open in new window
    const newWindow = window.open(classroomUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    if (newWindow) {
      // Monitor if the window is closed to handle cleanup
      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          clearInterval(checkClosed);
          setIsRedirecting(false);
          onLeave();
        }
      }, 1000);
    } else {
      // Fallback to same window if popup blocked
      window.location.href = classroomUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Flexible Classroom</CardTitle>
          <p className="text-muted-foreground">
            Ready to join your online lesson
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-lg">
                {credentials.lessonTitle || `Lesson ${credentials.roomId}`}
              </h3>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                Role: {credentials.userRole === 'teacher' ? 'Teacher' : 'Student'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Duration: 1 hour</span>
            </div>

            {expectedStudents.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Expected participants: {expectedStudents.length + 1}</span>
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Welcome, {credentials.userName}!</strong>
              <br />
              Click below to join your Flexible Classroom session. The classroom will open in a new window.
            </p>
          </div>

          <Button
            onClick={handleJoinClassroom}
            className="w-full"
            size="lg"
            disabled={isRedirecting}
          >
            {isRedirecting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Opening Classroom...
              </>
            ) : (
              <>
                <ExternalLink className="h-5 w-5 mr-2" />
                Join Flexible Classroom
              </>
            )}
          </Button>

          <div className="text-center">
            <Button
              onClick={onLeave}
              variant="ghost"
              size="sm"
              disabled={isRedirecting}
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleFlexibleClassroom;
