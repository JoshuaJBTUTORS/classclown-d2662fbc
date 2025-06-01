
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Calendar, BookOpen, Phone, Mail } from 'lucide-react';

interface LockedFeatureProps {
  featureName: string;
  featureIcon?: React.ReactNode;
  description: string;
  onBookTrial: () => void;
}

const LockedFeature: React.FC<LockedFeatureProps> = ({
  featureName,
  featureIcon,
  description,
  onBookTrial
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/5 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full shadow-xl bg-white/90 backdrop-blur-sm border border-white/20">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
              {featureIcon || <Calendar className="h-16 w-16 text-gray-300" />}
              <div className="absolute -bottom-2 -right-2 bg-yellow-500 rounded-full p-2">
                <Lock className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            {featureName} Access
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 mt-3">
            {description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-primary/10 to-primary/20 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-primary mb-3">
              Unlock Full Access with a Trial Lesson
            </h3>
            <p className="text-gray-700 mb-4">
              Book a free trial lesson with one of our expert tutors to unlock all platform features including scheduling, homework management, and personalized learning plans.
            </p>
            <Button 
              onClick={onBookTrial}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-medium shadow-lg"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Book Free Trial Lesson
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900">Expert Tutors</h4>
              <p className="text-sm text-gray-600">Learn from qualified educators</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
              <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900">Flexible Scheduling</h4>
              <p className="text-sm text-gray-600">Book lessons at your convenience</p>
            </div>
          </div>
          
          <div className="border-t pt-6 text-center">
            <p className="text-gray-600 mb-4">
              Need help or have questions? Contact our team:
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" size="sm">
                <Phone className="mr-2 h-4 w-4" />
                Call Us
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" />
                Email Us
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LockedFeature;
