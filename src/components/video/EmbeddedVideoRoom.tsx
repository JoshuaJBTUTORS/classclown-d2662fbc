
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Maximize2, 
  Minimize2, 
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface EmbeddedVideoRoomProps {
  roomUrl: string;
  lessonTitle?: string;
  onExit: () => void;
  className?: string;
}

const EmbeddedVideoRoom: React.FC<EmbeddedVideoRoomProps> = ({
  roomUrl,
  lessonTitle = "Video Room",
  onExit,
  className = ""
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Reset states when roomUrl changes
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);
  }, [roomUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
    toast.error('Failed to load video room');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    setHasError(false);
  };

  const openInNewTab = () => {
    window.open(roomUrl, '_blank', 'noopener,noreferrer');
    toast.success('Opening video room in new tab...');
  };

  if (!roomUrl) {
    return (
      <Card className="w-full h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No Room URL</h3>
              <p className="text-sm text-gray-600">
                Video room URL is not available
              </p>
            </div>
            <Button onClick={onExit} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'w-full h-full'}`}>
      {/* Header Controls */}
      <div className={`flex items-center justify-between p-4 bg-white border-b ${isFullscreen ? 'shadow-lg' : ''}`}>
        <div className="flex items-center gap-4">
          <Button 
            onClick={onExit} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {isFullscreen ? 'Exit Room' : 'Back'}
          </Button>
          <h2 className="font-semibold text-gray-900">{lessonTitle}</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {hasError && (
            <Button onClick={handleRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
          
          <Button onClick={openInNewTab} variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            New Tab
          </Button>
          
          <Button onClick={toggleFullscreen} variant="outline" size="sm">
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4 mr-2" />
            ) : (
              <Maximize2 className="h-4 w-4 mr-2" />
            )}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
        </div>
      </div>

      {/* Video Room Content */}
      <div className={`relative ${isFullscreen ? 'h-[calc(100vh-80px)]' : 'h-[600px]'} bg-gray-100`}>
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-sm text-gray-600">Loading video room...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center space-y-4 max-w-md">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Failed to Load Video Room
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  There was an error loading the video room. You can try refreshing or open it in a new tab.
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleRetry} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={openInNewTab}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* LessonSpace Iframe */}
        <iframe
          key={`${roomUrl}-${retryCount}`} // Force reload on retry
          src={roomUrl}
          className="w-full h-full border-0"
          allow="camera; microphone; display-capture; fullscreen"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="LessonSpace Video Room"
        />
      </div>
    </div>
  );
};

export default EmbeddedVideoRoom;
