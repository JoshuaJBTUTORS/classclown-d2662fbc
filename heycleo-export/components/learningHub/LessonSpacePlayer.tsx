import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Play, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LessonSpacePlayerProps {
  sessionId: string;
  title?: string;
  className?: string;
}

interface RecordingData {
  recording_url?: string;
  recording_available: boolean;
  expires_at?: string;
  error?: string;
}

const LessonSpacePlayer: React.FC<LessonSpacePlayerProps> = ({ 
  sessionId, 
  title = 'Lesson Recording', 
  className = '' 
}) => {
  const [recordingData, setRecordingData] = useState<RecordingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchRecordingUrl();
    }
  }, [sessionId]);

  const fetchRecordingUrl = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('get-lessonspace-recording', {
        body: { sessionId }
      });

      if (functionError) {
        throw functionError;
      }

      setRecordingData(data);

      if (!data.recording_available) {
        setError(data.error || 'Recording not available');
      }
    } catch (err) {
      console.error('Error fetching recording URL:', err);
      setError('Failed to load recording');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`aspect-video w-full bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading recording...</span>
        </div>
      </div>
    );
  }

  if (error || !recordingData?.recording_available) {
    return (
      <div className={`aspect-video w-full ${className}`}>
        <Alert className="h-full flex items-center justify-center">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {error || 'Recording not available for this lesson'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!recordingData.recording_url) {
    return (
      <div className={`aspect-video w-full bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Play className="h-8 w-8" />
          <span className="text-sm">Recording will be available soon</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`aspect-video w-full ${className}`}>
      <video
        src={recordingData.recording_url}
        title={title}
        controls
        className="w-full h-full rounded-lg"
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default LessonSpacePlayer;