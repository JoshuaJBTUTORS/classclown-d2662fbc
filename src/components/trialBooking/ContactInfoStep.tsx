
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User, Mail, Phone, BookOpen, Calendar, Clock } from 'lucide-react';

interface ContactInfoStepProps {
  formData: {
    parentName: string;
    childName: string;
    email: string;
    phone: string;
  };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
  selectedSubject: { id: string; name: string } | null;
  selectedDate: string;
  selectedTime: string;
}

const ContactInfoStep: React.FC<ContactInfoStepProps> = ({ 
  formData, 
  onChange, 
  errors,
  selectedSubject,
  selectedDate,
  selectedTime
}) => {
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
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Subject</p>
              <p className="text-sm text-gray-600">{selectedSubject?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Date</p>
              <p className="text-sm text-gray-600">{formatDate(selectedDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Time</p>
              <p className="text-sm text-gray-600">{formatTime(selectedTime)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="parentName">Parent Name *</Label>
            <Input
              type="text"
              id="parentName"
              value={formData.parentName}
              onChange={(e) => onChange('parentName', e.target.value)}
              className={errors.parentName ? 'border-red-500' : ''}
              placeholder="Enter parent's full name"
            />
            {errors.parentName && <p className="text-sm text-red-500 mt-1">{errors.parentName}</p>}
          </div>
          
          <div>
            <Label htmlFor="childName">Child Name *</Label>
            <Input
              type="text"
              id="childName"
              value={formData.childName}
              onChange={(e) => onChange('childName', e.target.value)}
              className={errors.childName ? 'border-red-500' : ''}
              placeholder="Enter child's full name"
            />
            {errors.childName && <p className="text-sm text-red-500 mt-1">{errors.childName}</p>}
          </div>
          
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => onChange('email', e.target.value)}
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Enter email address"
              />
            </div>
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => onChange('phone', e.target.value)}
                className="pl-10"
                placeholder="Enter phone number (optional)"
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Ready to book!</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Your trial lesson will be scheduled with a qualified tutor</li>
              <li>• You'll receive a confirmation email shortly</li>
              <li>• The lesson link will be sent before your appointment</li>
              <li>• No payment required for the trial lesson</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactInfoStep;
