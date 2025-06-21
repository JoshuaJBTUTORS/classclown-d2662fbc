import React from 'react';
import { RemoteUser, LocalVideoTrack } from 'agora-rtc-react';
import VideoCard from './VideoCard';
import StudentPlaceholderCard from './StudentPlaceholderCard';

interface ExpectedStudent {
  id: number;
  first_name: string;
  last_name: string;
}

interface VerticalVideoGridProps {
  localCameraTrack?: any;
  remoteUsers: any[];
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  userRole: 'tutor' | 'student';
  expectedStudents?: ExpectedStudent[];
  isScreenSharing?: boolean;
}

const VerticalVideoGrid: React.FC<VerticalVideoGridProps> = ({
  localCameraTrack,
  remoteUsers,
  isAudioEnabled,
  isVideoEnabled,
  userRole,
  expectedStudents = [],
  isScreenSharing = false
}) => {
  const totalExpectedParticipants = expectedStudents.length + 1; // +1 for tutor/current user
  const currentParticipants = remoteUsers.length + 1;
  
  // Determine grid layout based on total expected participants
  const gridCols = totalExpectedParticipants > 2 ? 'grid-cols-2' : 'grid-cols-1';

  // Create a set of joined student IDs for comparison
  const joinedStudentIds = new Set(
    remoteUsers.map(user => parseInt(user.uid)).filter(id => !isNaN(id))
  );

  // Filter expected students to show only those who haven't joined
  const pendingStudents = expectedStudents.filter(
    student => !joinedStudentIds.has(student.id)
  );

  const getLocalUserName = () => {
    if (isScreenSharing) {
      return `You (${userRole}) - Camera`;
    }
    return `You (${userRole})`;
  };

  return (
    <div className="h-full p-3 overflow-y-auto">
      <div className={`grid ${gridCols} gap-3 auto-rows-max`}>
        {/* Local user video - Show camera feed when screen sharing */}
        <VideoCard
          userName={getLocalUserName()}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isLocal={true}
          isScreenSharing={false}
        >
          {isVideoEnabled && localCameraTrack ? (
            <LocalVideoTrack
              track={localCameraTrack}
              play={true}
              className="w-full h-full object-cover"
            />
          ) : null}
        </VideoCard>

        {/* Remote users (joined students) */}
        {remoteUsers.map((user) => {
          // Try to find the student name from expected students
          const studentId = parseInt(user.uid);
          const studentData = expectedStudents.find(s => s.id === studentId);
          const userName = studentData 
            ? `${studentData.first_name} ${studentData.last_name}`.trim()
            : `User ${user.uid}`;

          return (
            <VideoCard
              key={user.uid}
              userName={userName}
              isAudioEnabled={user.hasAudio}
              isVideoEnabled={user.hasVideo}
              isLocal={false}
            >
              <RemoteUser user={user} />
            </VideoCard>
          );
        })}
        
        {/* Expected students who haven't joined yet */}
        {pendingStudents.map((student) => (
          <StudentPlaceholderCard
            key={student.id}
            studentName={`${student.first_name} ${student.last_name}`.trim()}
          />
        ))}
        
        {/* Fallback placeholder when no expected students and no one has joined */}
        {expectedStudents.length === 0 && remoteUsers.length === 0 && (
          <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs">+</span>
              </div>
              <p className="text-xs">Waiting for others</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerticalVideoGrid;
