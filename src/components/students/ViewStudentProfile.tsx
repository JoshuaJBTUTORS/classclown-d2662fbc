
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Student } from '@/types/student';
import { UserX, Users } from 'lucide-react';

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

  // Check if this is a standalone student (no parent)
  const isStandaloneStudent = !student.parent_id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {isStandaloneStudent ? (
              <UserX className="h-5 w-5 text-orange-500" />
            ) : (
              <Users className="h-5 w-5 text-blue-500" />
            )}
            {student.first_name} {student.last_name}'s Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Student ID</h3>
              <p className="text-base">{student.student_id || 'No ID assigned'}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Account Type</h3>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={student.status === 'active' ? 'default' : 'outline'} 
                  className="capitalize"
                >
                  {student.status}
                </Badge>
                <Badge 
                  variant={isStandaloneStudent ? 'secondary' : 'outline'}
                  className="flex items-center gap-1"
                >
                  {isStandaloneStudent ? (
                    <>
                      <UserX className="h-3 w-3" />
                      Standalone
                    </>
                  ) : (
                    <>
                      <Users className="h-3 w-3" />
                      Family-linked
                    </>
                  )}
                </Badge>
              </div>
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
                <p className="text-base">{student.email || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Phone Number</h3>
                <p className="text-base">{student.phone || 'Not provided'}</p>
              </div>
              {student.grade && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Grade/Year</h3>
                  <p className="text-base">{student.grade}</p>
                </div>
              )}
            </div>
          </div>
          
          {!isStandaloneStudent && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Parent Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Parent Name</h3>
                  <p className="text-base">{student.parentName || 'Not provided'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Parent Email</h3>
                  <p className="text-base">{student.parentEmail || 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}
          
          {isStandaloneStudent && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserX className="h-4 w-4 text-orange-500" />
                <h2 className="text-lg font-semibold text-orange-700">Standalone Student</h2>
              </div>
              <p className="text-sm text-orange-600">
                This student is not currently linked to any parent account. They can be converted to a family account or linked to an existing parent later if needed.
              </p>
            </div>
          )}
          
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
