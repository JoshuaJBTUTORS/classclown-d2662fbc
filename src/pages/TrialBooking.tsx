
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, GraduationCap, Users, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TrialBooking = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    parentName: '',
    childName: '',
    email: '',
    phone: '',
    yearGroup: '',
    subject: '',
    preferredDate: '',
    preferredTime: '',
    message: ''
  });

  const yearGroups = [
    'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
    'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13'
  ];

  const subjects = [
    'Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'French', 'Spanish', 'German', 'Computer Science',
    'Art', 'Music', 'Drama', 'PE', 'Business Studies', 'Economics', 'Psychology'
  ];

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get year group and subject IDs (we'll use placeholder UUIDs for now)
      const { error } = await supabase
        .from('trial_bookings')
        .insert({
          parent_name: formData.parentName,
          child_name: formData.childName,
          email: formData.email,
          phone: formData.phone || null,
          preferred_date: formData.preferredDate || null,
          preferred_time: formData.preferredTime || null,
          message: formData.message || null,
          year_group_id: '00000000-0000-0000-0000-000000000001', // Placeholder
          subject_id: '00000000-0000-0000-0000-000000000001', // Placeholder
          status: 'pending'
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('Trial lesson request submitted successfully!');
    } catch (error) {
      console.error('Error submitting trial booking:', error);
      toast.error('Failed to submit trial lesson request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <img 
                src="/lovable-uploads/d35d104e-dca8-466e-8820-20dcc5131ad3.png" 
                alt="Class Clown Logo" 
                className="h-16 mx-auto mb-4" 
              />
            </div>
            
            <Card className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Request Submitted!</h1>
                <p className="text-lg text-gray-600 mb-6">
                  Thank you for your interest in Class Clown Tutoring. We've received your trial lesson request.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• We'll review your request within 24 hours</li>
                    <li>• Our team will contact you to confirm the trial lesson details</li>
                    <li>• We'll match you with the perfect tutor for your child</li>
                    <li>• You'll receive a confirmation email with all the details</li>
                  </ul>
                </div>
                <Button onClick={() => window.location.href = '/'} className="bg-[#e94b7f] hover:bg-[#d63d6f]">
                  Return to Homepage
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <img 
              src="/lovable-uploads/d35d104e-dca8-466e-8820-20dcc5131ad3.png" 
              alt="Class Clown Logo" 
              className="h-16 mx-auto mb-6" 
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Book Your Free Trial Lesson
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience personalized tutoring with Class Clown. No commitment required - 
              just exceptional learning tailored to your child's needs.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <GraduationCap className="w-8 h-8 text-[#e94b7f] mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Expert Tutors</h3>
              <p className="text-sm text-gray-600">Qualified teachers with proven track records</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <Users className="w-8 h-8 text-[#e94b7f] mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Personalized Learning</h3>
              <p className="text-sm text-gray-600">Tailored lessons to match your child's learning style</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <Clock className="w-8 h-8 text-[#e94b7f] mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Flexible Scheduling</h3>
              <p className="text-sm text-gray-600">Lessons that fit around your family's schedule</p>
            </div>
          </div>

          {/* Booking Form */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Trial Lesson Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentName">Parent/Guardian Name *</Label>
                    <Input
                      id="parentName"
                      value={formData.parentName}
                      onChange={(e) => handleInputChange('parentName', e.target.value)}
                      required
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="childName">Child's Name *</Label>
                    <Input
                      id="childName"
                      value={formData.childName}
                      onChange={(e) => handleInputChange('childName', e.target.value)}
                      required
                      placeholder="Child's full name"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="07123 456789"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="yearGroup">Year Group *</Label>
                    <Select value={formData.yearGroup} onValueChange={(value) => handleInputChange('yearGroup', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year group" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearGroups.map((year) => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredDate">Preferred Date</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferredTime">Preferred Time</Label>
                    <Select value={formData.preferredTime} onValueChange={(value) => handleInputChange('preferredTime', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Additional Information</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Tell us about your child's learning goals, any specific areas they need help with, or any other requirements..."
                    rows={4}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-[#e94b7f] hover:bg-[#d63d6f] text-white font-semibold py-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Request Free Trial Lesson'}
                </Button>

                <p className="text-sm text-gray-500 text-center">
                  By submitting this form, you agree to be contacted by Class Clown Tutoring regarding your trial lesson request.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrialBooking;
