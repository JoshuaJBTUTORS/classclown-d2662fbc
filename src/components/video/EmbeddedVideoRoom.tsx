
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  ArrowLeft, 
  Maximize2, 
  Minimize2, 
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  Shield,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface EmbeddedVideoRoomProps {
  roomUrl: string;
  spaceId?: string;
  lessonTitle?: string;
  onExit: () => void;
  className?: string;
}

const EmbeddedVideoRoom: React.FC<EmbeddedVideoRoomProps> = ({
  roomUrl,
  spaceId,
  lessonTitle = "Video Room",
  onExit,
  className = ""
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [showTabMessage, setShowTabMessage] = useState(false);
  const { userRole, isAdmin, isOwner, isTutor } = useAuth();
  const isMobile = useIsMobile();

  // Determine if user has teacher/host privileges
  const isTeacherRole = isTutor || isAdmin || isOwner;

  // Use the roomUrl directly since it's already the appropriate URL based on role
  const displayUrl = roomUrl;

  useEffect(() => {
    // Reset states when roomUrl changes
    setIsLoading(true);
    setHasError(false);
  }, [displayUrl]);

  // Handle tab visibility changes to provide better UX
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabVisible(isVisible);
      
      if (!isVisible) {
        // Tab is hidden - video will freeze naturally (LessonSpace behavior)
        setShowTabMessage(true);
      } else if (showTabMessage) {
        // Tab is visible again - clear message after a delay
        setTimeout(() => setShowTabMessage(false), 3000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [showTabMessage]);

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

  const handleSoftRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    // Soft refresh without destroying iframe
    const iframe = document.querySelector('iframe[title="LessonSpace Video Room"]') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src; // Refresh without destroying
    }
  };

  const handleHardRefresh = () => {
    // Force page reload as last resort
    window.location.reload();
  };

  const openInNewTab = () => {
    window.open(displayUrl, '_blank', 'noopener,noreferrer');
    toast.success('Opening video room in new tab...');
  };

  if (!displayUrl) {
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
      <div className={`flex items-center justify-between p-2 md:p-4 bg-gradient-to-r from-background to-background/95 border-b border-border/20 ${isFullscreen ? 'shadow-lg' : ''}`}>
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <Button 
            onClick={onExit} 
            variant="outline" 
            size={isMobile ? "sm" : "sm"}
            className="flex items-center gap-1 md:gap-2 shrink-0"
          >
            <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
            {!isMobile ? (isFullscreen ? 'Exit Room' : 'Back') : ''}
          </Button>
          <div className="flex items-center gap-1 md:gap-2 min-w-0 flex-1">
            <h2 className="font-semibold text-foreground text-sm md:text-base truncate">{lessonTitle}</h2>
            {!isMobile && (
              <>
                {isTeacherRole ? (
                  <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs shrink-0">
                    <Shield className="h-3 w-3" />
                    Host
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary-foreground rounded-full text-xs shrink-0">
                    <Users className="h-3 w-3" />
                    Student
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {hasError && (
            <>
              <Button onClick={handleSoftRefresh} variant="outline" size="sm" className="h-8 w-8 md:w-auto md:h-auto p-0 md:p-2">
                <RefreshCw className="h-3 w-3 md:h-4 md:w-4" />
                {!isMobile && <span className="ml-2">Refresh</span>}
              </Button>
              <Button onClick={handleHardRefresh} variant="outline" size="sm" className="h-8 w-8 md:w-auto md:h-auto p-0 md:p-2 text-destructive">
                <RefreshCw className="h-3 w-3 md:h-4 md:w-4" />
                {!isMobile && <span className="ml-2">Hard Reset</span>}
              </Button>
            </>
          )}
          
          <Button onClick={openInNewTab} variant="outline" size="sm" className="h-8 w-8 md:w-auto md:h-auto p-0 md:p-2">
            <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
            {!isMobile && <span className="ml-2">New Tab</span>}
          </Button>
          
          <Button onClick={toggleFullscreen} variant="outline" size="sm" className="h-8 w-8 md:w-auto md:h-auto p-0 md:p-2">
            {isFullscreen ? (
              <Minimize2 className="h-3 w-3 md:h-4 md:w-4" />
            ) : (
              <Maximize2 className="h-3 w-3 md:h-4 md:w-4" />
            )}
            {!isMobile && <span className="ml-2">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>}
          </Button>
        </div>
      </div>

      {/* Video Room Content */}
      <div className={`relative ${isFullscreen ? 'h-[calc(100vh-80px)]' : 'h-[600px]'} bg-gray-100`}>
        {/* Tab Switch Message */}
        {showTabMessage && !isTabVisible && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg z-20 text-sm">
            Video paused due to tab switch - click here when you return
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-sm text-gray-600">
                Loading video room{isTeacherRole ? ' (Host mode)' : ' (Student mode)'}...
              </p>
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
                  Connection Issue
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Video room connection lost. Try refreshing gently first, or use hard reset if needed.
                </p>
              </div>
              <div className="flex flex-col gap-2 justify-center">
                <Button onClick={handleSoftRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Connection
                </Button>
                <div className="flex gap-2">
                  <Button onClick={openInNewTab} variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    New Tab
                  </Button>
                  <Button onClick={handleHardRefresh} variant="destructive" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Hard Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LessonSpace Iframe - No key prop to prevent forced recreation */}
        <iframe
          src={displayUrl}
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
