
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { Course } from '@/types/course';
import { useNavigate } from 'react-router-dom';

interface CourseCardProps {
  course: Course;
  isAdmin?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, isAdmin = false }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="h-40 bg-gray-100 relative">
        {course.cover_image_url ? (
          <img 
            src={course.cover_image_url} 
            alt={course.title} 
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <Badge 
          variant="outline" 
          className={`absolute top-2 right-2 ${getStatusColor(course.status)}`}
        >
          {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
        </Badge>
      </div>
      
      <CardHeader>
        <CardTitle className="line-clamp-2">{course.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {course.description || "No description available"}
        </CardDescription>
      </CardHeader>
      
      <CardFooter className="mt-auto">
        <Button 
          onClick={() => navigate(`/course/${course.id}`)} 
          className="w-full"
          variant={course.status === 'published' ? "default" : "outline"}
          disabled={course.status !== 'published' && !isAdmin}
        >
          {course.status === 'published' ? "Start Learning" : "Preview Course"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
