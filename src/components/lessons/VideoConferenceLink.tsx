
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, ExternalLink, Clipboard, CheckCircle, Users, ChevronDown, ChevronUp, Link, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';
import { useAgora } from '@/hooks/useAgora';

interface VideoConferenceLinkProps {
  link: string | null;
  provider: string | null;
  className?: string;
  userRole?: 'tutor' | 'student' | 'admin' | 'owner';
  isGroupLesson?: boolean;
  studentCount?: number;
  lessonId?: string;
  hasLessonSpace?: boolean;
  spaceId?: string;
  // Agora-specific props
  hasAgora?: boolean;
  agoraChannelName?: string;
  agoraToken?: string;
  agoraUid?: number;
  agoraAppId?: string;
}

const VideoConferenceLink: React.FC<VideoConferenceLinkProps> = ({ 
  link, 
  provider, 
  className,
  userRole = 'tutor',
  isGroupLesson = false,
  studentCount = 0,
  lessonId,
  hasLessonSpace = false,
  spaceId,
  hasAgora = false,
  agoraChannelName,
  agoraToken,
  agoraUid,
  agoraAppId
}) => {
  const [copied, setCopied] = React.useState(false);
  const [isStudentLinksOpen, setIsStudentLinksOpen] = React.useState(false);
  const [isAgoraSetupOpen, setIsAgoraSetupOpen] = React.useState(false);
  const navigate = useNavigate();
  const { createRoom, getTokens, isCreatingRoom, isGeneratingTokens } = useAgora();

  // Don't render if no links are available and no lesson space and no Agora
  if (!link && !hasLessonSpace && !hasAgora) return null;

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const getProviderName = () => {
    switch (provider) {
      case 'lesson_space':
        return 'Lesson Space';
      case 'google_meet':
        return 'Google Meet';
      case 'zoom':
        return 'Zoom';
      case 'agora':
        return 'Agora Video Call';
      default:
        return 'Video Conference';
    }
  };

  const getJoinButtonText = () => {
    if (userRole === 'tutor') {
      return isGroupLesson ? 'Start Group Lesson' : 'Start Lesson';
    }
    return 'Join Lesson';
  };

  const getRoleDescription = () => {
    if (userRole === 'tutor') {
      return 'Teacher Access';
    } else if (userRole === 'student') {
      return 'Student Access';
    }
    return 'Admin Access';
  };

  const handleCreateAgoraRoom = async () => {
    if (!lessonId) {
      toast.error('Lesson ID is required');
      return;
    }

    const roomData = await createRoom({
      lessonId,
      title: 'Video Lesson',
      startTime: new Date().toISOString(),
      duration: 60
    });

    if (roomData) {
      toast.success('Agora room created! You can now join the video call.');
    }
  };

  const handleJoinAgoraRoom = async () => {
    if (!lessonId) {
      toast.error('Lesson ID is required');
      return;
    }

    // Map userRole to expected type for getTokens
    const agoraUserRole = (userRole === 'admin' || userRole === 'owner') ? 'tutor' : userRole as 'tutor' | 'student' | 'parent';

    // Get fresh tokens for the user
    const tokens = await getTokens(lessonId, agoraUserRole);
    
    if (tokens) {
      // In a real implementation, you would integrate with the Agora Web SDK here
      // For now, we'll show a success message
      toast.success('Agora tokens generated! Ready to join video call.');
      console.log('Agora connection details:', tokens);
    }
  };

  // Generate the correct URL based on user role
  const getCorrectUrl = () => {
    if (provider === 'lesson_space' && hasLessonSpace && spaceId) {
      if (userRole === 'student') {
        // Students get the simple invite URL
        return `https://www.thelessonspace.com/space/${spaceId}`;
      } else {
        // Tutors and admins get the authenticated URL
        return link;
      }
    }
    return link;
  };

  const handleJoinLesson = () => {
    // Handle Agora provider
    if (provider === 'agora') {
      handleJoinAgoraRoom();
      return;
    }

    // For students and parents, redirect to consent flow for Lesson Space
    if ((userRole === 'student') && lessonId) {
      navigate(`/join-lesson/${lessonId}`);
      return;
    }

    // For tutors, admins, and owners, join directly
    const urlToUse = getCorrectUrl();
    if (urlToUse) {
      window.open(urlToUse, '_blank');
      toast.success('Redirecting to Lesson Space...');
    } else {
      toast.error('Lesson space not available');
    }
  };

  const urlToUse = getCorrectUrl();
  const showStudentJoinLink = (userRole === 'tutor' || userRole === 'admin' || userRole === 'owner') && 
                              provider === 'lesson_space' && hasLessonSpace && studentCount > 0 && spaceId;

  const showAgoraSetup = (userRole === 'tutor' || userRole === 'admin' || userRole === 'owner') && 
                         (provider === 'agora' || !provider) && lessonId;

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex flex-col space-y-3">
        {/* Main lesson URL section */}
        {(urlToUse || provider === 'agora') && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Video className="h-5 w-5 text-blue-500 mr-2" />
                <div>
                  <h3 className="text-sm font-medium">{getProviderName()}</h3>
                  {isGroupLesson && (
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Users className="h-3 w-3 mr-1" />
                      <span>Group lesson • {studentCount} participants</span>
                    </div>
                  )}
                </div>
              </div>
              <div className={cn(
                "text-xs px-2 py-1 rounded",
                userRole === 'tutor' 
                  ? "text-green-600 bg-green-50" 
                  : userRole === 'student'
                  ? "text-blue-600 bg-blue-50"
                  : "text-purple-600 bg-purple-50"
              )}>
                {getRoleDescription()}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleJoinLesson}
                className="flex-1"
                variant={userRole === 'tutor' ? 'default' : 'outline'}
                disabled={provider === 'agora' && isGeneratingTokens}
              >
                {provider === 'agora' && isGeneratingTokens ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {getJoinButtonText()}
                  </>
                )}
              </Button>
              
              {/* Only show copy button for non-Agora providers and non-students */}
              {userRole !== 'student' && provider !== 'agora' && urlToUse && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => copyToClipboard(urlToUse)}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clipboard className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {userRole === 'tutor' && provider === 'lesson_space' && (
              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                <strong>Teacher privileges:</strong> You have full control of the lesson space with leader permissions.
              </div>
            )}

            {userRole === 'tutor' && provider === 'agora' && (
              <div className="text-xs text-muted-foreground bg-green-50 p-2 rounded">
                <strong>Agora Video Call:</strong> High-quality video conferencing with whiteboard and recording capabilities.
              </div>
            )}

            {userRole === 'student' && provider === 'lesson_space' && (
              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                <strong>Student access:</strong> Click "Join Lesson" to review requirements and enter the lesson space.
              </div>
            )}

            {userRole === 'student' && provider === 'agora' && (
              <div className="text-xs text-muted-foreground bg-green-50 p-2 rounded">
                <strong>Student access:</strong> Click "Join Lesson" to connect to the video call.
              </div>
            )}
          </>
        )}

        {/* Agora setup section for tutors/admins */}
        {showAgoraSetup && (
          <div className="border-t pt-3">
            <Collapsible open={isAgoraSetupOpen} onOpenChange={setIsAgoraSetupOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground">
                <span>Agora Video Call Setup</span>
                {isAgoraSetupOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {!agoraChannelName ? (
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 text-orange-500 mr-2" />
                      <span className="text-sm">Video call room not created</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleCreateAgoraRoom}
                      disabled={isCreatingRoom}
                      className="h-7 px-3"
                    >
                      {isCreatingRoom ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          Creating...
                        </>
                      ) : (
                        'Create Room'
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                    <div className="flex items-center">
                      <Video className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">Video call room ready</span>
                    </div>
                    <div className="text-xs text-green-600">
                      Channel: {agoraChannelName}
                    </div>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {!agoraChannelName 
                    ? 'Create an Agora video call room for this lesson.'
                    : 'Students can now join the video call when you start the lesson.'
                  }
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Student invite link section for tutors/admins */}
        {showStudentJoinLink && (
          <div className="border-t pt-3">
            <Collapsible open={isStudentLinksOpen} onOpenChange={setIsStudentLinksOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground">
                <span>Student Invite Link</span>
                {isStudentLinksOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <Link className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm">Student invite URL</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://www.thelessonspace.com/space/${spaceId}`, '_blank')}
                      className="h-7 px-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`https://www.thelessonspace.com/space/${spaceId}`)}
                      className="h-7 px-2"
                    >
                      <Clipboard className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Share this simple URL with students to join the lesson.
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>
    </Card>
  );
};

export default VideoConferenceLink;
