
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home, Calendar, Phone, Mail } from 'lucide-react';

const TrialBookingConfirmation: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/landing');
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-800">
              Trial Lesson Booked Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Thank you for booking a trial lesson with us. We're excited to help you get started on your learning journey!
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li>• You'll receive a confirmation email within the next few minutes</li>
                <li>• One of our qualified tutors will be assigned to your lesson</li>
                <li>• We'll send you the video lesson link 24 hours before your appointment</li>
                <li>• Your trial lesson is completely free - no payment required</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Need help or have questions?</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>Call us: +44 (0) 20 1234 5678</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Email: support@tutorplatform.com</span>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button 
                onClick={handleGoHome}
                className="bg-[#e94b7f] hover:bg-[#d63d6f] text-white px-8 py-2 flex items-center gap-2 mx-auto"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrialBookingConfirmation;
