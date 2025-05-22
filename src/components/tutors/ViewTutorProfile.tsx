import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Tutor } from '@/types/tutor';

interface ViewTutorProfileProps {
  tutor: Tutor | null;
  isOpen: boolean;
  onClose: () => void;
}

const generateStars = (rating: number | null) => {
  if (rating === null) return '☆☆☆☆☆';
  
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{tutor.first_name} {tutor.last_name}'s Profile</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Title</h3>
              <p className="text-base">{tutor.title || 'No title'}</p>
            </div>
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
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Full Name</h3>
                <p className="text-base">
                  {tutor.title ? `${tutor.title} ` : ''}{tutor.first_name} {tutor.last_name}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Email Address</h3>
                <p className="text-base">{tutor.email}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Phone Number</h3>
                <p className="text-base">{tutor.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Academic Information</h2>
            <div className="pl-2">
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Specialities</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {tutor.specialities && tutor.specialities.length > 0 ? (
                  tutor.specialities.map((speciality, i) => (
                    <Badge key={i} variant="secondary">
                      {speciality}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No specialities listed</p>
                )}
              </div>
            </div>
            
            {tutor.education && (
              <div className="pl-2 mt-4">
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Education</h3>
                <p className="text-base">{tutor.education}</p>
              </div>
            )}
          </div>
          
          {tutor.bio && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Biography</h2>
              <p className="text-base pl-2">{tutor.bio}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Rating</h3>
              <div className="flex items-center gap-1">
                <span className="text-amber-500">{generateStars(tutor.rating)}</span>
                <span className="font-medium">{tutor.rating || 'Not yet rated'}</span>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Joined Date</h3>
              <p className="text-base">{tutor.joined_date}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewTutorProfile;
