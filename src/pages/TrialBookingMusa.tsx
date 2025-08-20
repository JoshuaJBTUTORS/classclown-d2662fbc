import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createTrialBooking } from '@/services/trialBookingService';
import { checkEmailPhoneUniqueness } from '@/services/uniquenessValidationService';
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
  subject: {
    id: string;
    name: string;
  } | null;
  date: string;
  time: string; // Display time (demo session time)
  lessonTime: string; // Actual lesson time
  selectedTutorId: string;
}

const TrialBookingMusaPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    parentName: '',
    childName: '',
    email: '',
    phone: '',
    subject: null,
    date: '',
    time: '',
    lessonTime: '',
    selectedTutorId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uniquenessCheck, setUniquenessCheck] = useState<{
    checked: boolean;
    isUnique: boolean;
    existingRecords: any;
  }>({ checked: false, isUnique: true, existingRecords: null });
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const stepLabels = ['Subject', 'Date & Time', 'Contact'];
  const totalSteps = stepLabels.length;

  // Keep availability data loaded when we have subject and date, regardless of current step
  const {
    slots,
    isLoading: availabilityLoading
  } = useAggregatedAvailability(
    formData.subject ? formData.subject.id : undefined, 
    formData.date ? formData.date : undefined
  );

  // Check uniqueness when email or phone changes on the contact step
  useEffect(() => {
    if (currentStep === 3 && (formData.email || formData.phone)) {
      const checkUniqueness = async () => {
        const result = await checkEmailPhoneUniqueness(formData.email, formData.phone);
        setUniquenessCheck({
          checked: true,
          isUnique: result.isUnique,
          existingRecords: result.existingRecords
        });
      };

      const debounceTimer = setTimeout(checkUniqueness, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [formData.email, formData.phone, currentStep]);

  const updateFormData = (field: string, value: string | { id: string; name: string; } | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Reset uniqueness check when email or phone changes
    if (field === 'email' || field === 'phone') {
      setUniquenessCheck({ checked: false, isUnique: true, existingRecords: null });
    }
  };

  // Enhanced time selection handler to store tutor ID and lesson time
  const handleTimeSelect = (time: string) => {
    const selectedSlot = slots.find(slot => slot.time === time);
    const tutorId = selectedSlot?.availableTutorIds[0] || '';
    const lessonTime = selectedSlot?.lessonTime || '';
    
    console.log('Selected time slot:', { displayTime: time, lessonTime, selectedSlot, tutorId });
    
    updateFormData('time', time); // Display time (demo session time)
    updateFormData('lessonTime', lessonTime); // Actual lesson time
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
    
    console.log('Submitting Musa trial booking request with data:', formData);
    setIsSubmitting(true);
    
    try {
      // Create trial booking request with Musa source and uniqueness flag
      const trialBookingResult = await createTrialBooking({
        parent_name: formData.parentName,
        child_name: formData.childName,
        email: formData.email,
        phone: formData.phone,
        preferred_date: formData.date,
        preferred_time: formData.time, // Demo session time (displayed time)
        lesson_time: formData.lessonTime, // Actual lesson time
        subject_id: formData.subject?.id || '',
        message: `Musa trial lesson request for ${formData.childName}`,
        booking_source: 'musa',
        is_unique_booking: uniquenessCheck.isUnique
      });

      if (!trialBookingResult.success) {
        throw new Error(trialBookingResult.error || 'Failed to submit trial booking request.');
      }

      toast({
        title: "Musa Trial Booking Submitted!",
        description: uniquenessCheck.isUnique 
          ? "Your unique trial booking has been submitted and will count towards our targets!"
          : "Your trial booking has been submitted (duplicate contact info detected)."
      });
      
      navigate('/trial-booking-confirmation');
    } catch (err: any) {
      console.error('Error during Musa trial booking submission:', err);
      toast({
        variant: "destructive",
        title: "Error!",
        description: err.message || 'An error occurred while submitting your trial booking request.'
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
            onSubjectChange={subject => updateFormData('subject', subject)}
            error={errors.subject}
          />
        );
      case 2:
        return (
          <DateTimeSelector
            slots={slots}
            selectedDate={formData.date}
            selectedTime={formData.time}
            onDateSelect={date => updateFormData('date', date)}
            onTimeSelect={handleTimeSelect}
            isLoading={availabilityLoading}
            subjectId={formData.subject?.id}
          />
        );
      case 3:
        return (
          <div className="space-y-6">
            <ContactInfoStep
              formData={formData}
              onChange={updateFormData}
              errors={errors}
              selectedSubject={formData.subject}
              selectedDate={formData.date}
              selectedTime={formData.time}
            />
            
            {/* Uniqueness Alert */}
            {uniquenessCheck.checked && (
              <Alert className={uniquenessCheck.isUnique ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
                <AlertTriangle className={`h-4 w-4 ${uniquenessCheck.isUnique ? "text-green-600" : "text-amber-600"}`} />
                <AlertDescription className={uniquenessCheck.isUnique ? "text-green-800" : "text-amber-800"}>
                  {uniquenessCheck.isUnique ? (
                    <span className="font-medium">✓ Unique booking detected - This will count towards our targets!</span>
                  ) : (
                    <span>
                      <span className="font-medium">⚠ Duplicate contact detected</span>
                      <br />
                      This email/phone number is already in our system. The booking will still proceed but won't count towards earnings targets.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Book a Musa Trial Lesson</h1>
        <p className="text-muted-foreground text-center mb-8">
          Submit a request for a free 45-minute trial lesson - Musa Referral Link
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

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </div>

          {currentStep < totalSteps ? (
            <Button 
              type="button" 
              onClick={handleNext}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Musa Request'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrialBookingMusaPage;
