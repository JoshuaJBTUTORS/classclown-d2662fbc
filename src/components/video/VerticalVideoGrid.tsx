
import React from 'react';
import { RemoteUser, LocalVideoTrack } from 'agora-rtc-react';
import VideoCard from './VideoCard';
import StudentPlaceholderCard from './StudentPlaceholderCard';

interface ExpectedStudent {
  id: number;
  first_name: string;
  last_name: string;
}

interface StudentContext {
  studentId: number;
  studentName: string;
  isParentJoin: boolean;
}

interface VerticalVideoGridProps {
  localCameraTrack?: any;
  remoteUsers: any[];
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  userRole: 'tutor' | 'student';
  expectedStudents?: ExpectedStudent[];
  studentContext?: StudentContext | null;
  displayName?: string;
  currentUID?: number;
  isScreenSharing?: boolean;
}

const VerticalVideoGrid: React.FC<VerticalVideoGridProps> = ({
  localCameraTrack,
  remoteUsers,
  isAudioEnabled,
  isVideoEnabled,
  userRole,
  expectedStudents = [],
  studentContext,
  displayName,
  currentUID,
  isScreenSharing = false
}) => {
  const totalExpectedParticipants = expectedStudents.length + 1; // +1 for tutor/current user
  const currentParticipants = remoteUsers.length + 1;
  
  // Determine grid layout based on total expected participants
  const gridCols = totalExpectedParticipants > 2 ? 'grid-cols-2' : 'grid-cols-1';

  // Create a set of joined user UIDs for comparison
  const joinedUIDs = new Set(
    remoteUsers.map(user => parseInt(user.uid)).filter(id => !isNaN(id))
  );

  // Map remote users to their display information
  const getRemoteUserDisplayInfo = (user: any) => {
    const uid = parseInt(user.uid);
    
    // Check if this UID matches any expected student
    const matchingStudent = expectedStudents.find(student => student.id === uid);
    
    if (matchingStudent) {
      return {
        name: `${matchingStudent.first_name} ${matchingStudent.last_name}`.trim(),
        isStudent: true
      };
    }
    
    // Check if this might be a tutor (UID in the 100000+ range)
    if (uid >= 100000) {
      return {
        name: 'Tutor',
        isStudent: false
      };
    }
    
    // Fallback for unknown users
    return {
      name: `User ${uid}`,
      isStudent: false
    };
  };

  // Filter expected students to show only those who haven't joined
  // If current user is a student (including parent join), exclude them from pending list
  const pendingStudents = expectedStudents.filter(student => {
    // Don't show as pending if this student has joined
    if (joinedUIDs.has(student.id)) {
      return false;
    }
    
    // Don't show as pending if this is the current user's student context
    if (studentContext && studentContext.studentId === student.id) {
      return false;
    }
    
    return true;
  });

  const getLocalUserName = () => {
    if (displayName) {
      return displayName;
    }
    
    if (studentContext) {
      return studentContext.isParentJoin 
        ? `${studentContext.studentName} (via parent)`
        : studentContext.studentName;
    }
    
    if (isScreenSharing) {
      return `You (${userRole}) - Camera`;
    }
    return `You (${userRole})`;
  };

  console.log('VerticalVideoGrid - Rendering with:', {
    currentUID,
    remoteUsersCount: remoteUsers.length,
    expectedStudentsCount: expectedStudents.length,
    pendingStudentsCount: pendingStudents.length,
    studentContext,
    displayName,
    joinedUIDs: Array.from(joinedUIDs)
  });

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

        {/* Remote users (joined participants) */}
        {remoteUsers.map((user) => {
          const displayInfo = getRemoteUserDisplayInfo(user);
          
          return (
            <VideoCard
              key={user.uid}
              userName={displayInfo.name}
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
