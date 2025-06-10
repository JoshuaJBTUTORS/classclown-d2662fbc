import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAggregatedAvailability } from '@/hooks/useAggregatedAvailability';
import DateTimeSelector from '@/components/trialBooking/DateTimeSelector';
import MultiSelectSubjects from '@/components/tutors/MultiSelectSubjects';

const TrialBooking = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    parentName: '',
    childName: '',
    email: '',
    phone: '',
    selectedSubjects: [] as string[],
    preferredDate: '',
    preferredTime: '',
    message: ''
  });

  const { slots, isLoading: slotsLoading } = useAggregatedAvailability(
    formData.selectedSubjects[0], // Use first selected subject for availability
    formData.preferredDate
  );

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset dependent fields when subject changes
    if (field === 'selectedSubjects') {
      setFormData(prev => ({ ...prev, preferredDate: '', preferredTime: '' }));
      if ((value as string[]).length > 0) {
        setCurrentStep(2);
      }
    } else if (field === 'preferredDate') {
      setFormData(prev => ({ ...prev, preferredTime: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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
          year_group_id: null, // No longer using year groups
          subject_id: formData.selectedSubjects[0] || null, // Use first selected subject
          tutor_id: null, // Will be assigned during approval process
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

  const canProceedToStep = (step: number) => {
    switch (step) {
      case 2: 
        return formData.selectedSubjects.length > 0;
      case 3: 
        // Fixed validation: Check that both date and time are selected, and required contact fields are filled
        const hasDateAndTime = formData.preferredDate && formData.preferredTime;
        const hasRequiredContactInfo = formData.parentName && formData.childName && formData.email;
        console.log('Step 3 validation:', { hasDateAndTime, hasRequiredContactInfo, formData });
        return hasDateAndTime && hasRequiredContactInfo;
      default: 
        return false;
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
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Booking Confirmed!</h1>
                <p className="text-lg text-gray-600 mb-6">
                  Your trial lesson request has been submitted successfully.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• We'll match you with the perfect tutor for your needs</li>
                    <li>• You'll receive a confirmation email with lesson details</li>
                    <li>• Your assigned tutor will contact you before the lesson</li>
                    <li>• Join the lesson at the scheduled time via our platform</li>
                    <li>• No payment required - it's completely free!</li>
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
          <div className="text-center mb-8">
            <img 
              src="/lovable-uploads/d35d104e-dca8-466e-8820-20dcc5131ad3.png" 
              alt="Class Clown Logo" 
              className="h-16 mx-auto mb-6" 
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Smart Trial Lesson Booking
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tell us what you need and we'll find the perfect tutor and time slot for you.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep 
                      ? 'bg-[#e94b7f] text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-8 h-0.5 ${
                      step < currentStep ? 'bg-[#e94b7f]' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && "What subject would you like to learn?"}
                {currentStep === 2 && "When would you like your lesson?"}
                {currentStep === 3 && "Contact Details & Confirmation"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Subject Selection */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subjects">Select Subject(s) *</Label>
                    <div className="mt-2">
                      <MultiSelectSubjects
                        selectedSubjectIds={formData.selectedSubjects}
                        onSubjectsChange={(subjectIds) => handleInputChange('selectedSubjects', subjectIds)}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Choose the subjects you'd like tutoring in. You can select multiple subjects.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Date & Time Selection */}
              {currentStep === 2 && (
                <DateTimeSelector
                  slots={slots}
                  selectedDate={formData.preferredDate}
                  selectedTime={formData.preferredTime}
                  onDateSelect={(date) => handleInputChange('preferredDate', date)}
                  onTimeSelect={(time) => handleInputChange('preferredTime', time)}
                  isLoading={slotsLoading}
                />
              )}

              {/* Step 3: Contact Details */}
              {currentStep === 3 && (
                <form onSubmit={handleSubmit} className="space-y-4">
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

                  <div>
                    <Label htmlFor="message">Additional Information</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Tell us about your child's learning goals or any specific requirements..."
                      rows={3}
                    />
                  </div>

                  {/* Booking Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Booking Summary</h3>
                    <div className="text-blue-800 text-sm space-y-1">
                      <p><strong>Subject:</strong> {formData.selectedSubjects.length > 0 ? `${formData.selectedSubjects.length} subject(s) selected` : 'None selected'}</p>
                      <p><strong>Date:</strong> {formData.preferredDate}</p>
                      <p><strong>Time:</strong> {formData.preferredTime}</p>
                      <p><strong>Tutor Assignment:</strong> We'll match you with the best available tutor</p>
                    </div>
                  </div>
                </form>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {currentStep < 3 ? (
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!canProceedToStep(currentStep + 1)}
                    className="bg-[#e94b7f] hover:bg-[#d63d6f] flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canProceedToStep(3)}
                    className="bg-[#e94b7f] hover:bg-[#d63d6f] flex items-center gap-2"
                  >
                    {isSubmitting ? 'Submitting...' : 'Book Trial Lesson'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrialBooking;
