
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

interface VideoRoomErrorProps {
  error: string | null;
  lessonId?: string;
  videoRoomRole: 'tutor' | 'student';
  netlessError?: string | null;
  isRegenerating: boolean;
  onRetry: () => void;
  onRegenerateTokens: () => void;
  onRegenerateNetlessToken?: () => void;
  onGoBack: () => void;
}

const VideoRoomError: React.FC<VideoRoomErrorProps> = ({
  error,
  lessonId,
  videoRoomRole,
  netlessError,
  isRegenerating,
  onRetry,
  onRegenerateTokens,
  onRegenerateNetlessToken,
  onGoBack
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connection Error
          </h3>
          <p className="text-red-600 mb-4">
            {error || 'Video conference not available'}
          </p>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Lesson:</strong> {lessonId}</p>
            <p><strong>User Role:</strong> {videoRoomRole}</p>
            {netlessError && <p><strong>Whiteboard:</strong> {netlessError}</p>}
          </div>
          <div className="space-y-3 mt-6">
            <Button onClick={onRetry} className="w-full" disabled={isRegenerating}>
              {isRegenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Regenerating...
                </>
              ) : (
                'Try Again'
              )}
            </Button>
            <Button onClick={onRegenerateTokens} variant="outline" className="w-full" disabled={isRegenerating}>
              {isRegenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Regenerating Tokens...
                </>
              ) : (
                'Regenerate Tokens'
              )}
            </Button>
            {netlessError && onRegenerateNetlessToken && (
              <Button onClick={onRegenerateNetlessToken} variant="outline" className="w-full">
                Fix Whiteboard
              </Button>
            )}
            <Button onClick={onGoBack} variant="outline" className="w-full">
              Go Back to Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoRoomError;
