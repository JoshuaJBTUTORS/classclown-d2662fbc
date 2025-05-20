
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  status: 'active' | 'inactive';
  joinedDate: string;
  first_name: string;
  last_name: string;
  parent_first_name: string;
  parent_last_name: string;
  student_id?: string;
}

interface ViewStudentProfileProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewStudentProfile: React.FC<ViewStudentProfileProps> = ({ student, isOpen, onClose }) => {
  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{student.name}'s Profile</DialogTitle>
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
                <p className="text-base">{student.parent_first_name}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Last Name</h3>
                <p className="text-base">{student.parent_last_name}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Academic Information</h2>
            <div className="pl-2">
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Subjects</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {student.subjects.map((subject, i) => (
                  <Badge key={i} variant="secondary">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">Joined Date</h3>
            <p className="text-base">{student.joinedDate}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewStudentProfile;
