
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

// Import FCR UI Scene components
import { 
  FcrUISceneProvider, 
  FcrRegion,
  Layout,
  NavigationBar,
  RoomMidStreamsContainer,
  Whiteboard,
  ScreenShareContainer,
  RemoteControlContainer,
  StreamWindowsContainer,
  WhiteboardToolbar,
  ScenesController,
  HandsUpContainer,
  Chat,
  DialogContainer,
  LoadingContainer,
  WidgetContainer,
  ToastContainer,
  Award,
  Float,
  FixedAspectRatioRootBox,
  SceneSwitch
} from 'fcr-ui-scene';

interface FcrUISceneClassroomProps {
  appId: string;
  rtmToken: string;
  channelName: string;
  uid: number;
  userName: string;
  userRole: 'teacher' | 'student';
  lessonTitle?: string;
  onClose: () => void;
}

const FcrUISceneClassroom: React.FC<FcrUISceneClassroomProps> = ({
  appId,
  rtmToken,
  channelName,
  uid,
  userName,
  userRole,
  lessonTitle,
  onClose
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Configuration for FCR UI Scene
  const sceneConfig = {
    appId,
    region: FcrRegion.NA,
    userId: uid.toString(),
    userName,
    roomUuid: channelName,
    roomType: 10, // Cloud Class room type
    roomName: lessonTitle || channelName,
    pretest: false,
    token: rtmToken,
    language: 'en',
    duration: 60 * 60 * 2, // 2 hours
    roleType: userRole === 'teacher' ? 1 : 2, // 1 = teacher, 2 = student
  };

  const handleSuccess = () => {
    console.log('[FCRUISCENE] Classroom connected successfully');
    setIsLoading(false);
    toast.success('Classroom connected successfully');
  };

  const handleError = (error: any) => {
    console.error('[FCRUISCENE] Classroom error:', error);
    setError(`Classroom Error: ${error.message || 'Unknown error'}`);
    setIsLoading(false);
    toast.error(`Classroom error: ${error.message || 'Unknown error'}`);
  };

  const handleDestroy = () => {
    console.log('[FCRUISCENE] Classroom destroyed');
    onClose();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-500 text-lg font-medium">
            Classroom Error
          </div>
          <p className="text-gray-600">
            {error}
          </p>
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Retry Loading
            </Button>
            <Button onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 relative overflow-hidden">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-40">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="text-lg font-medium text-gray-900">
              Loading Flexible Classroom...
            </div>
            <div className="text-sm text-gray-600">
              Initializing FCR UI Scene
            </div>
          </div>
        </div>
      )}

      {/* FCR UI Scene Component-based Implementation */}
      <FcrUISceneProvider
        config={sceneConfig}
        onSuccess={handleSuccess}
        onError={handleError}
        onDestroy={handleDestroy}
      >
        <FixedAspectRatioRootBox>
          <SceneSwitch>
            <Layout className="edu-room mid-class-room" direction="col">
              <NavigationBar />
              <Layout className="flex-grow items-stretch relative justify-center fcr-room-bg" direction="col">
                <RoomMidStreamsContainer />
                <Whiteboard />
                <ScreenShareContainer />
                <RemoteControlContainer />
                <StreamWindowsContainer />
              </Layout>
              <WhiteboardToolbar />
              <ScenesController />
              <Float bottom={15} right={10} align="end" gap={2}>
                <HandsUpContainer />
                <Chat />
              </Float>
              <DialogContainer />
              <LoadingContainer />
            </Layout>
            <WidgetContainer />
            <ToastContainer />
            <Award />
          </SceneSwitch>
        </FixedAspectRatioRootBox>
      </FcrUISceneProvider>
    </div>
  );
};

export default FcrUISceneClassroom;
