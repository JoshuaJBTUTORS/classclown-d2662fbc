import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Play, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TranscriptionSectionProps {
  lesson: {
    id: string;
    title: string;
    lesson_space_session_id?: string | null;
    transcription?: {
      id: string;
      status: 'processing' | 'available' | 'error';
      transcription_url?: string;
      expires_at?: string;
    };
  };
  onTranscriptionUpdate?: () => void;
}

export const TranscriptionSection: React.FC<TranscriptionSectionProps> = ({
  lesson,
  onTranscriptionUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getStatusIcon = () => {
    switch (lesson.transcription?.status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (lesson.transcription?.status) {
      case 'available':
        return 'Available';
      case 'processing':
        return 'Processing';
      case 'error':
        return 'Error';
      default:
        return 'Not started';
    }
  };

  const getStatusVariant = () => {
    switch (lesson.transcription?.status) {
      case 'available':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleCheckTranscription = async () => {
    if (!lesson.lesson_space_session_id) {
      toast({
        title: "No Session ID",
        description: "This lesson doesn't have a session ID for transcription.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-lesson-summaries', {
        body: {
          action: 'get-transcription',
          lessonId: lesson.id
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Transcription Available",
          description: "The lesson transcription is ready.",
        });
      } else {
        toast({
          title: "Transcription Status",
          description: data.message || "Transcription is still being processed.",
        });
      }

      onTranscriptionUpdate?.();
    } catch (error) {
      console.error('Error checking transcription:', error);
      toast({
        title: "Error",
        description: "Failed to check transcription status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTranscription = async () => {
    if (!lesson.transcription?.transcription_url) {
      toast({
        title: "No Download URL",
        description: "Transcription download URL is not available.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if URL has expired
      if (lesson.transcription.expires_at) {
        const expiryDate = new Date(lesson.transcription.expires_at);
        if (expiryDate < new Date()) {
          // URL expired, refresh it
          await handleCheckTranscription();
          return;
        }
      }

      // Open download URL in new tab
      window.open(lesson.transcription.transcription_url, '_blank');
      
      toast({
        title: "Download Started",
        description: "The transcription download has started.",
      });
    } catch (error) {
      console.error('Error downloading transcription:', error);
      toast({
        title: "Download Error",
        description: "Failed to download transcription.",
        variant: "destructive",
      });
    }
  };

  if (!lesson.lesson_space_session_id) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Play className="h-4 w-4" />
          Lesson Transcription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={getStatusVariant()}>
              {getStatusText()}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckTranscription}
              disabled={loading}
            >
              {loading ? "Checking..." : "Check Status"}
            </Button>
            
            {lesson.transcription?.status === 'available' && lesson.transcription.transcription_url && (
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadTranscription}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
            )}
          </div>
        </div>

        {lesson.transcription?.expires_at && lesson.transcription?.status === 'available' && (
          <div className="text-xs text-muted-foreground">
            Download link expires: {new Date(lesson.transcription.expires_at).toLocaleString()}
          </div>
        )}

        {lesson.transcription?.status === 'processing' && (
          <div className="text-sm text-muted-foreground">
            The transcription is being processed. This usually takes a few minutes after the lesson ends.
          </div>
        )}

        {lesson.transcription?.status === 'error' && (
          <div className="text-sm text-red-600">
            There was an error processing the transcription. Please try checking the status again.
          </div>
        )}
      </CardContent>
    </Card>
  );
};