
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, Star, User } from 'lucide-react';

interface AvailableTutor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  bio?: string;
  rating?: number;
  specialities?: string[];
}

interface TutorSelectorProps {
  tutors: AvailableTutor[];
  selectedTutor?: string;
  onTutorSelect: (tutorId: string) => void;
  isLoading?: boolean;
}

const TutorSelector: React.FC<TutorSelectorProps> = ({
  tutors,
  selectedTutor,
  onTutorSelect,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tutors.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tutors available</h3>
          <p className="text-gray-500">
            No tutors are currently available for the selected subject. Please try a different subject or contact us for assistance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {tutors.map((tutor) => (
        <Card 
          key={tutor.id}
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedTutor === tutor.id 
              ? 'ring-2 ring-[#e94b7f] border-[#e94b7f]' 
              : 'border-gray-200 hover:border-[#e94b7f]/50'
          }`}
          onClick={() => onTutorSelect(tutor.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#e94b7f]/10 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-[#e94b7f]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {tutor.first_name} {tutor.last_name}
                  </h3>
                  {tutor.rating && (
                    <div className="flex items-center mt-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-600">{tutor.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {tutor.bio && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{tutor.bio}</p>
                  )}
                  {tutor.specialities && tutor.specialities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tutor.specialities.slice(0, 3).map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {tutor.specialities.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{tutor.specialities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant={selectedTutor === tutor.id ? "default" : "outline"}
                size="sm"
                className={selectedTutor === tutor.id ? "bg-[#e94b7f] hover:bg-[#d63d6f]" : ""}
              >
                {selectedTutor === tutor.id ? 'Selected' : 'Select'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TutorSelector;
