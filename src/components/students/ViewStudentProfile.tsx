import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Student } from '@/types/student'; // Import the shared Student type

interface ViewStudentProfileProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewStudentProfile: React.FC<ViewStudentProfileProps> = ({ student, isOpen, onClose }) => {
  if (!student) return null;

  // Process subjects to ensure it's an array
  const subjectsArray = typeof student.subjects === 'string' 
    ? student.subjects.split(',').map(subject => subject.trim()) 
    : student.subjects || [];
    
  // Format join date from created_at if joinedDate is not available
  const displayDate = student.joinedDate || (student.created_at 
    ? new Date(student.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Not available');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{student.first_name} {student.last_name}'s Profile</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Student ID</h3>
              <p className="text-base">{student.student_id || 'No ID assigned'}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Status</h3>
              <Badge 
                variant={student.status === 'active' ? 'default' : 'outline'} 
                className="capitalize"
              >
                {student.status}
              </Badge>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Student Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">First Name</h3>
                <p className="text-base">{student.first_name}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Last Name</h3>
                <p className="text-base">{student.last_name}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Email Address</h3>
                <p className="text-base">{student.email}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Phone Number</h3>
                <p className="text-base">{student.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Parent Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">First Name</h3>
                <p className="text-base">{student.parent_first_name || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Last Name</h3>
                <p className="text-base">{student.parent_last_name || 'Not provided'}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Academic Information</h2>
            <div className="pl-2">
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Subjects</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {subjectsArray.length > 0 ? (
                  subjectsArray.map((subject, i) => (
                    <Badge key={i} variant="secondary">
                      {subject}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No subjects assigned</p>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">Joined Date</h3>
            <p className="text-base">{displayDate}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewStudentProfile;
