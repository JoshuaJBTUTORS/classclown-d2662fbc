
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, User, BookOpen, Calendar, Clock } from 'lucide-react';

interface ConfirmationStepProps {
  formData: {
    parentName: string;
    childName: string;
    email: string;
    phone: string;
    subject: { id: string; name: string } | null;
    date: string;
    time: string;
  };
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ formData }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Confirm Your Booking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Contact Information</h4>
                <p className="text-sm text-gray-600">Parent: {formData.parentName}</p>
                <p className="text-sm text-gray-600">Child: {formData.childName}</p>
                <p className="text-sm text-gray-600">Email: {formData.email}</p>
                {formData.phone && (
                  <p className="text-sm text-gray-600">Phone: {formData.phone}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Subject</h4>
                <p className="text-sm text-gray-600">{formData.subject?.name}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Date</h4>
                <p className="text-sm text-gray-600">{formatDate(formData.date)}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Time</h4>
                <p className="text-sm text-gray-600">{formatTime(formData.time)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Ready to book!</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Your trial lesson will be scheduled with a qualified tutor</li>
              <li>• You'll receive a confirmation email shortly</li>
              <li>• The lesson link will be sent before your appointment</li>
              <li>• No payment required for the trial lesson</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfirmationStep;
