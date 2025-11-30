
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Course, CourseModule, CourseLesson } from '@/types/course';
import { learningHubService } from '@/services/learningHubService';

interface LearningHubContextType {
  currentCourse: Course | null;
  setCurrentCourse: (course: Course | null) => void;
  currentModule: CourseModule | null;
  setCurrentModule: (module: CourseModule | null) => void;
  currentLesson: CourseLesson | null;
  setCurrentLesson: (lesson: CourseLesson | null) => void;
  isLoading: boolean;
  error: Error | null;
}

const LearningHubContext = createContext<LearningHubContextType | undefined>(undefined);

export const LearningHubProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [currentModule, setCurrentModule] = useState<CourseModule | null>(null);
  const [currentLesson, setCurrentLesson] = useState<CourseLesson | null>(null);

  // Fetch courses when needed
  const { isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: learningHubService.getCourses,
    enabled: false, // Only fetch when needed
  });

  const value = {
    currentCourse,
    setCurrentCourse,
    currentModule,
    setCurrentModule,
    currentLesson,
    setCurrentLesson,
    isLoading,
    error: error as Error | null,
  };

  return <LearningHubContext.Provider value={value}>{children}</LearningHubContext.Provider>;
};

export const useLearningHub = () => {
  const context = useContext(LearningHubContext);
  if (!context) {
    throw new Error('useLearningHub must be used within a LearningHubProvider');
  }
  return context;
};
