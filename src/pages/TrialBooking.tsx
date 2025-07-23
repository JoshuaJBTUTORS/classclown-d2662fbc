
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { createTrialStudent } from '@/services/trialAccountService';
import { createTrialLesson } from '@/services/trialLessonService';
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
    time: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const stepLabels = ['Subject', 'Date & Time', 'Contact'];
  const totalSteps = stepLabels.length;

  // Only fetch availability when we have subject and are on step 2
  const { slots, isLoading: availabilityLoading } = useAggregatedAvailability(
    currentStep === 2 && formData.subject ? formData.subject.id : undefined, 
    currentStep === 2 && formData.date ? formData.date : undefined
  );

  const updateFormData = (field: string, value: string | { id: string; name: string } | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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

    setIsSubmitting(true);
    try {
      // Create trial student account
      const trialAccountResult = await createTrialStudent({
        parent_name: formData.parentName,
        child_name: formData.childName,
        email: formData.email,
        phone: formData.phone
      });

      if (!trialAccountResult.success) {
        throw new Error(trialAccountResult.error || 'Failed to create trial student account.');
      }

      // Create trial lesson
      const trialLessonResult = await createTrialLesson({
        bookingId: 'trial-booking-' + Date.now(),
        tutorId: slots.find(slot => slot.time === formData.time)?.availableTutorIds[0] || '',
        studentId: trialAccountResult.studentId,
        preferredDate: formData.date,
        preferredTime: formData.time,
        subjectId: formData.subject?.id,
        approvedBy: 'system'
      });

      if (!trialLessonResult.success) {
        throw new Error(trialLessonResult.error || 'Failed to create trial lesson.');
      }

      toast({
        title: "Success!",
        description: "Trial lesson booked successfully!",
      });

      navigate('/trial-booking-confirmation');
    } catch (err: any) {
      console.error('Error during trial booking:', err);
      toast({
        variant: "destructive",
        title: "Error!",
        description: err.message || 'An error occurred while booking the trial lesson.',
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
            onTimeSelect={(time) => updateFormData('time', time)}
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
          Get started with a free 60-minute trial lesson with one of our qualified tutors
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
                  Booking...
                </>
              ) : (
                'Book Trial Lesson'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrialBookingPage;
