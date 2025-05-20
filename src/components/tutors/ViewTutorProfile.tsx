
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from "@/components/ui/card";

interface Tutor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialities: string[];
  status: 'active' | 'inactive' | 'pending';
  rating: number;
  joinedDate: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  bio?: string;
  education?: string;
}

interface ViewTutorProfileProps {
  tutor: Tutor | null;
  isOpen: boolean;
  onClose: () => void;
}

const generateStars = (rating: number) => {
  const fullStars = Math.floor(rating);
  const remainder = rating - fullStars;
  const stars = [];
  
  for (let i = 0; i < fullStars; i++) {
    stars.push('★');
  }
  
  if (remainder >= 0.5) {
    stars.push('★');
  }
  
  while (stars.length < 5) {
    stars.push('☆');
  }
  
  return stars.join('');
};

const ViewTutorProfile: React.FC<ViewTutorProfileProps> = ({ tutor, isOpen, onClose }) => {
  if (!tutor) return null;

  // Extract first name and last name from the full name if not directly provided
  const firstName = tutor.first_name || tutor.name.split(' ')[0];
  const lastName = tutor.last_name || tutor.name.split(' ').slice(1).join(' ');
  const tutorTitle = tutor.title || firstName.startsWith('Dr.') ? 'Doctor' : 
                     firstName.startsWith('Prof.') ? 'Professor' : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{tutor.name}'s Profile</DialogTitle>
          <DialogDescription>
            View detailed information about this tutor.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Status</h3>
              <Badge 
                variant={
                  tutor.status === 'active' ? 'default' : 
                  tutor.status === 'pending' ? 'outline' : 'secondary'
                } 
                className="capitalize"
              >
                {tutor.status}
              </Badge>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Rating</h3>
              <div className="flex items-center gap-1">
                <span className="text-amber-500">{generateStars(tutor.rating)}</span>
                <span className="font-medium">{tutor.rating}</span>
              </div>
            </div>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-2">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Email Address</h3>
                  <p className="text-base">{tutor.email}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Phone Number</h3>
                  <p className="text-base">{tutor.phone || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-2">Professional Information</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Title</h3>
                  <p className="text-base">{tutorTitle || 'Tutor'}</p>
                </div>
                {tutor.bio && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Biography</h3>
                    <p className="text-base">{tutor.bio}</p>
                  </div>
                )}
                {tutor.education && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Education</h3>
                    <p className="text-base">{tutor.education}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-2">Specialities</h2>
              <div className="flex flex-wrap gap-2 mt-1">
                {tutor.specialities.map((speciality, i) => (
                  <Badge key={i} variant="secondary" className="text-sm">
                    {speciality}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">Joined Date</h3>
            <p className="text-base">{tutor.joinedDate}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewTutorProfile;
