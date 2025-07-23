
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User, Mail, Phone } from 'lucide-react';

interface ContactInfoStepProps {
  formData: {
    parentName: string;
    childName: string;
    email: string;
    phone: string;
  };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

const ContactInfoStep: React.FC<ContactInfoStepProps> = ({ formData, onChange, errors }) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
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
      </CardContent>
    </Card>
  );
};

export default ContactInfoStep;
