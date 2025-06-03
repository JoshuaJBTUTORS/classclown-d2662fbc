
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Course } from '@/types/course';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Edit } from 'lucide-react';
import ProgressBar from './ProgressBar';
import { useIsMobile } from '@/hooks/use-mobile';

interface CourseCardProps {
  course: Course;
  isAdmin?: boolean;
  hasProgress?: boolean;
  progress?: number;
  viewMode?: 'grid' | 'list';
}

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  isAdmin = false,
  hasProgress = false,
  progress = 0,
  viewMode = 'grid'
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isList = viewMode === 'list';
  
  const handleCardClick = () => {
    navigate(`/course/${course.id}`);
  };
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/course/${course.id}/edit`);
  };

  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to get badge color based on course status
  const getStatusBadge = () => {
    switch (course.status) {
      case 'published':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
            Published
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
            Draft
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200">
            Archived
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden hover:shadow-md transition-all border-gray-200/70 bg-white/90 backdrop-blur-sm cursor-pointer group",
        isList ? "flex flex-col sm:flex-row" : "flex flex-col"
      )}
      onClick={handleCardClick}
    >
      {/* Course Image - Responsive sizing */}
      <div 
        className={cn(
          "relative", 
          isList 
            ? "w-full sm:w-48 md:w-56 lg:w-64 h-48 sm:h-full" 
            : "w-full aspect-[16/9]"
        )}
      >
        {course.cover_image_url ? (
          <img 
            src={course.cover_image_url} 
            alt={course.title} 
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-gray-400" />
          </div>
        )}
        
        {/* Status badge - top right */}
        <div className="absolute top-2 right-2">
          {getStatusBadge()}
        </div>
      </div>

      {/* Course Content - Responsive layout */}
      <div className={cn(
        "flex flex-col flex-1",
        isList ? "sm:max-w-[calc(100%-12rem)] md:max-w-[calc(100%-14rem)] lg:max-w-[calc(100%-16rem)]" : ""
      )}>
        <CardContent className={cn("flex-1", isList ? "p-4 sm:p-6" : "p-5")}>
          <div className="flex flex-col h-full">
            <div className="mb-2">
              {course.subject && (
                <Badge variant="outline" className="text-xs mb-2 bg-blue-50 text-blue-700 border-blue-200">
                  {course.subject}
                </Badge>
              )}
              <h3 className={cn(
                "font-medium line-clamp-2 group-hover:text-primary transition-colors",
                isList ? "text-lg sm:text-xl" : "text-lg" 
              )}>
                {course.title}
              </h3>
            </div>
            
            <div className="flex-1">
              {course.description && (
                <p className={cn(
                  "text-gray-600",
                  isList ? "line-clamp-3 text-sm sm:text-base" : "line-clamp-2 text-sm"
                )}>
                  {course.description}
                </p>
              )}
            </div>
            
            <div className={cn("mt-4", isList ? "block" : isMobile ? "block" : "hidden")}>
              {hasProgress && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1">
                    <ProgressBar progress={progress} size="sm" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">{progress}%</span>
                </div>
              )}
              
              <div className={cn(
                "flex gap-2 items-center justify-between text-xs text-gray-500",
                isList ? "mt-2" : "mt-1.5"
              )}>
                <div className="flex items-center gap-1">
                  {course.difficulty_level && (
                    <div className="flex items-center gap-1">
                      <span className="capitalize">{course.difficulty_level}</span>
                      <span className="mx-1.5">•</span>
                    </div>
                  )}
                  <span>
                    {formatDate(course.created_at)}
                  </span>
                </div>
                
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleEditClick}
                    className="h-8 p-0 px-2 text-gray-600 hover:text-gray-900"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Edit</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer with progress and price - Responsive display */}
        <CardFooter className={cn(
          "flex items-center justify-between pt-0 border-t border-gray-100",
          isList ? "px-4 sm:px-6 py-3" : "p-4",
          isList || !isMobile ? "block" : "hidden"
        )}>
          {hasProgress && !isList && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1">
                <ProgressBar progress={progress} size="sm" />
              </div>
              <span className="text-xs font-medium text-gray-600">{progress}%</span>
            </div>
          )}
          
          <div className={cn(
            "flex items-center justify-between w-full",
            (isList && hasProgress) ? "mt-2" : ""
          )}>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              {!isList && (
                <>
                  {course.difficulty_level && (
                    <>
                      <span className="capitalize">{course.difficulty_level}</span>
                      <span className="mx-1">•</span>
                    </>
                  )}
                </>
              )}
              
              {course.price ? (
                <span className="font-semibold text-sm text-gray-900">£{(course.price / 100).toFixed(2)}</span>
              ) : (
                <span className="text-sm text-gray-900">Free</span>
              )}
            </div>
            
            {!isList && isAdmin && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleEditClick}
                className="h-7 text-gray-600 hover:text-gray-900"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Edit</span>
              </Button>
            )}
          </div>
        </CardFooter>
      </div>
    </Card>
  );
};

// Helper function for conditional class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default CourseCard;
