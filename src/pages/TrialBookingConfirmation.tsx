
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home, Clock, Phone, Mail } from 'lucide-react';

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
              Trial Lesson Request Submitted!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Thank you for your trial lesson request. We've received your information and will review it shortly.
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-orange-800">
                <li>• Our team will review your trial lesson request</li>
                <li>• We'll contact you within 24 hours to confirm your booking</li>
                <li>• Once approved, we'll assign a qualified tutor to your lesson</li>
                <li>• You'll receive the video lesson link before your appointment</li>
                <li>• Your trial lesson is completely free - no payment required</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Need help or have questions?</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>Call us: +44 01438582848</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Email: enquiries@jb-tutors.com</span>
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
