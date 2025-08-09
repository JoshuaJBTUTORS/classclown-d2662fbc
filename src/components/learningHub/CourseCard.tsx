
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, Clock, Award, Users } from 'lucide-react';
import { Course } from '@/types/course';
import LearningHubSubscriptionModal from './LearningHubSubscriptionModal';

interface CourseCardProps {
  course: Course;
  viewMode?: 'grid' | 'list';
}

const CourseCard: React.FC<CourseCardProps> = ({ course, viewMode = 'grid' }) => {
  const navigate = useNavigate();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleCourseClick = () => {
    navigate(`/course/${course.id}`);
  };

  const handleSubscribeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSubscriptionModal(true);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
        {/* Course Image */}
        <div 
          className="h-48 bg-gradient-to-r from-primary/20 to-primary/30 flex items-center justify-center"
          onClick={handleCourseClick}
        >
          {course.cover_image_url ? (
            <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <BookOpen className="h-16 w-16 text-primary" />
          )}
        </div>

        <CardHeader className="pb-3" onClick={handleCourseClick}>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {course.title}
            </CardTitle>
            {course.status === 'published' && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                Available
              </Badge>
            )}
          </div>
          {course.subject && (
            <Badge variant="outline" className="w-fit">
              {course.subject}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <CardDescription className="line-clamp-3" onClick={handleCourseClick}>
            {course.description || 'Expand your knowledge with this comprehensive course.'}
          </CardDescription>

          {/* Course Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Self-paced</span>
            </div>
            {course.difficulty_level && (
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                <span>{course.difficulty_level}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>All levels</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Included with Learning Hub</p>
              <p className="text-lg font-bold text-primary">£25/month</p>
              <p className="text-xs text-muted-foreground">Access to all courses • 7-day free trial</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCourseClick}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button 
              size="sm"
              onClick={handleSubscribeClick}
              className="flex-1"
            >
              Get Access
            </Button>
          </div>
        </CardContent>
      </Card>

      <LearningHubSubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={() => {
          // Refresh the page or redirect after successful subscription
          window.location.reload();
        }}
      />
    </>
  );
};

export default CourseCard;
