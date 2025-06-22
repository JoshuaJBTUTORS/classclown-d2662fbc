
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface EmbeddedFlexibleClassroomProps {
  roomId: string;
  userUuid: string;
  userName: string;
  userRole: 'teacher' | 'student';
  rtmToken: string;
  appId: string;
  lessonTitle?: string;
  studentCount?: number;
  onError?: (error: string) => void;
  onClose?: () => void;
}

const EmbeddedFlexibleClassroom: React.FC<EmbeddedFlexibleClassroomProps> = ({
  roomId,
  userUuid,
  userName,
  userRole,
  rtmToken,
  appId,
  lessonTitle,
  studentCount = 1,
  onError,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generateClassroomUrl = () => {
    try {
      // Updated to use the correct Agora Flexible Classroom URL
      const baseUrl = 'https://demo.agora.io/education/web/';
      const params = new URLSearchParams({
        appId: appId,
        region: 'AP', // Asia Pacific
        roomUuid: roomId,
        userUuid: userUuid,
        userName: userName,
        roleType: userRole === 'teacher' ? '1' : '2',
        roomType: studentCount <= 1 ? '0' : '10', // 0 = 1v1, 10 = Cloud Class
        roomName: lessonTitle || `Lesson ${roomId}`,
        rtmToken: rtmToken,
        language: 'en',
        duration: '3600' // 1 hour
      });

      const fullUrl = `${baseUrl}?${params.toString()}`;
      console.log('Generated Flexible Classroom URL:', fullUrl);
      return fullUrl;
    } catch (error) {
      console.error('Error generating classroom URL:', error);
      throw new Error('Failed to generate classroom URL');
    }
  };

  useEffect(() => {
    const handleIframeLoad = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleIframeError = () => {
      setIsLoading(false);
      setHasError(true);
      setErrorMessage('Failed to load Flexible Classroom');
      toast.error('Failed to load classroom');
      onError?.('Failed to load Flexible Classroom');
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
      iframe.addEventListener('error', handleIframeError);

      return () => {
        iframe.removeEventListener('load', handleIframeLoad);
        iframe.removeEventListener('error', handleIframeError);
      };
    }
  }, [onError]);

  const handleOpenInNewWindow = () => {
    try {
      const url = generateClassroomUrl();
      window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      toast.success('Classroom opened in new window');
    } catch (error) {
      toast.error('Failed to open classroom');
      console.error('Error opening classroom:', error);
    }
  };

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Classroom Load Error
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {errorMessage || 'Unable to load the classroom. This might be due to network issues or an invalid classroom URL.'}
              </p>
            </div>
            <div className="space-y-2">
              <Button onClick={handleOpenInNewWindow} className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Window
              </Button>
              {onClose && (
                <Button onClick={onClose} variant="outline" className="w-full">
                  Go Back
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white z-10 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">Loading Classroom...</h3>
              <p className="text-sm text-gray-600">
                Setting up your {lessonTitle || 'lesson'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={generateClassroomUrl()}
        className="w-full h-screen border-0"
        title="Agora Flexible Classroom"
        allow="camera; microphone; fullscreen; display-capture"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
      />
      
      {onClose && (
        <Button
          onClick={onClose}
          variant="outline"
          className="absolute top-4 right-4 z-20 bg-white shadow-lg"
        >
          Exit Classroom
        </Button>
      )}
    </div>
  );
};

export default EmbeddedFlexibleClassroom;
