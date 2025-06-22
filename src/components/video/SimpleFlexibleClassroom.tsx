
import React, { useEffect } from 'react';
import { FlexibleClassroomCredentials } from '@/hooks/useFlexibleClassroom';
import { useNavigate } from 'react-router-dom';

interface SimpleFlexibleClassroomProps {
  credentials: FlexibleClassroomCredentials;
  onLeave: () => void;
  expectedStudents?: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
}

const SimpleFlexibleClassroom: React.FC<SimpleFlexibleClassroomProps> = ({
  credentials,
  onLeave,
  expectedStudents = []
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Instead of showing the old external redirect, navigate to our embedded classroom
    // Extract lesson ID from the room ID (assuming format: lesson_<uuid>)
    const lessonId = credentials.roomId.replace('lesson_', '').replace(/_/g, '-');
    navigate(`/flexible-classroom/${lessonId}`);
  }, [credentials, navigate]);

  // This component will redirect immediately, so we just show a loading state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to classroom...</p>
      </div>
    </div>
  );
};

export default SimpleFlexibleClassroom;
