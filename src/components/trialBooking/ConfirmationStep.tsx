
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, User, BookOpen, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ConfirmationStepProps {
  formData: {
    parentName: string;
    childName: string;
    email: string;
    phone: string;
    subject: string;
    date: string;
    time: string;
  };
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ formData }) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Confirm Your Trial Lesson
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4" />
              <span className="font-medium">Contact Information</span>
            </div>
            <div className="ml-6 space-y-1">
              <p><strong>Parent:</strong> {formData.parentName}</p>
              <p><strong>Child:</strong> {formData.childName}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              {formData.phone && <p><strong>Phone:</strong> {formData.phone}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <BookOpen className="h-4 w-4" />
              <span className="font-medium">Lesson Details</span>
            </div>
            <div className="ml-6 space-y-1">
              <p><strong>Subject:</strong> {formData.subject}</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(formData.date), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formData.time}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Next Steps:</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• We'll send a confirmation email with lesson details</li>
            <li>• You'll receive a calendar invite with the video link</li>
            <li>• Our team will contact you before the lesson to confirm</li>
            <li>• The lesson will last approximately 60 minutes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfirmationStep;
