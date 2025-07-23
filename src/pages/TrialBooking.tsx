import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { createTrialBooking } from '@/services/trialBookingService';
import { useAggregatedAvailability } from '@/hooks/useAggregatedAvailability';
import StepIndicator from '@/components/trialBooking/StepIndicator';
import SubjectSelectionStep from '@/components/trialBooking/SubjectSelectionStep';
import DateTimeSelector from '@/components/trialBooking/DateTimeSelector';
import ContactInfoStep from '@/components/trialBooking/ContactInfoStep';

interface FormData {
  parentName: string;
  childName: string;
  email: string;
  phone: string;
  subject: { id: string; name: string } | null;
  date: string;
  time: string;
  selectedTutorId: string;
}

const TrialBookingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    parentName: '',
    childName: '',
    email: '',
    phone: '',
    subject: null,
    date: '',
    time: '',
    selectedTutorId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const stepLabels = ['Subject', 'Date & Time', 'Contact'];
  const totalSteps = stepLabels.length;

  // Keep availability data loaded when we have subject and date, regardless of current step
  const { slots, isLoading: availabilityLoading } = useAggregatedAvailability(
    formData.subject ? formData.subject.id : undefined, 
    formData.date ? formData.date : undefined
  );

  const updateFormData = (field: string, value: string | { id: string; name: string } | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Enhanced time selection handler to store tutor ID
  const handleTimeSelect = (time: string) => {
    const selectedSlot = slots.find(slot => slot.time === time);
    const tutorId = selectedSlot?.availableTutorIds[0] || '';
    
    console.log('Selected time slot:', { time, selectedSlot, tutorId });
    
    updateFormData('time', time);
    updateFormData('selectedTutorId', tutorId);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.subject) newErrors.subject = 'Please select a subject';
        break;
      case 2:
        if (!formData.date) newErrors.date = 'Please select a date';
        if (!formData.time) newErrors.time = 'Please select a time';
        break;
      case 3:
        if (!formData.parentName.trim()) newErrors.parentName = 'Parent name is required';
        if (!formData.childName.trim()) newErrors.childName = 'Child name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    console.log('Submitting trial booking request with data:', formData);

    setIsSubmitting(true);
    try {
      // Create trial booking request (no lesson created yet)
      const trialBookingResult = await createTrialBooking({
        parent_name: formData.parentName,
        child_name: formData.childName,
        email: formData.email,
        phone: formData.phone,
        preferred_date: formData.date,
        preferred_time: formData.time,
        subject_id: formData.subject?.id || '',
        message: `Trial lesson request for ${formData.childName}`
      });

      if (!trialBookingResult.success) {
        throw new Error(trialBookingResult.error || 'Failed to submit trial booking request.');
      }

      toast({
        title: "Trial Booking Submitted!",
        description: "Your request has been submitted for review. We'll contact you within 24 hours.",
      });

      navigate('/trial-booking-confirmation');
    } catch (err: any) {
      console.error('Error during trial booking submission:', err);
      toast({
        variant: "destructive",
        title: "Error!",
        description: err.message || 'An error occurred while submitting your trial booking request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SubjectSelectionStep
            selectedSubject={formData.subject}
            onSubjectChange={(subject) => updateFormData('subject', subject)}
            error={errors.subject}
          />
        );
      case 2:
        return (
          <DateTimeSelector
            slots={slots}
            selectedDate={formData.date}
            selectedTime={formData.time}
            onDateSelect={(date) => updateFormData('date', date)}
            onTimeSelect={handleTimeSelect}
            isLoading={availabilityLoading}
            subjectId={formData.subject?.id}
          />
        );
      case 3:
        return (
          <ContactInfoStep
            formData={formData}
            onChange={updateFormData}
            errors={errors}
            selectedSubject={formData.subject}
            selectedDate={formData.date}
            selectedTime={formData.time}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Book a Trial Lesson</h1>
        <p className="text-gray-600 text-center mb-8">
          Submit a request for a free 60-minute trial lesson with one of our qualified tutors
        </p>

        <StepIndicator
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepLabels={stepLabels}
        />

        <div className="mt-8">
          {renderStep()}
        </div>

        <div className="flex justify-between items-center mt-8 max-w-2xl mx-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </div>

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 bg-[#e94b7f] hover:bg-[#d63d6f]"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-[#e94b7f] hover:bg-[#d63d6f]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrialBookingPage;
