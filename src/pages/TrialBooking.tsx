import { validatePhone, splitPhone } from '@/utils/phone';
import { useReferrerName, getRefCodeFromUrl } from '@/hooks/useReferrerName';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
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
const TrialBookingPage: React.FC = () => {
  const refCode = getRefCodeFromUrl();
  const referrerName = useReferrerName(refCode);
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const stepLabels = ['Subject', 'Date & Time', 'Contact'];
  const totalSteps = stepLabels.length;

  // Keep availability data loaded when we have subject and date, regardless of current step
  const {
    slots,
    isLoading: availabilityLoading
  } = useAggregatedAvailability(formData.subject ? formData.subject.id : undefined, formData.date ? formData.date : undefined);
  const updateFormData = (field: string, value: string | {
    id: string;
    name: string;
  } | null) => {
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
  };

  // Enhanced time selection handler to store tutor ID and lesson time
  const handleTimeSelect = (time: string) => {
    const selectedSlot = slots.find(slot => slot.time === time);
    const tutorId = selectedSlot?.availableTutorIds[0] || '';
    const lessonTime = selectedSlot?.lessonTime || '';
    console.log('Selected time slot:', {
      displayTime: time,
      lessonTime,
      selectedSlot,
      tutorId
    });
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
        if (!formData.email.trim()) newErrors.email = 'Email is required';else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';else {
          const phoneCheck = validatePhone(formData.phone, splitPhone(formData.phone).dial);
          if (!phoneCheck.valid) newErrors.phone = phoneCheck.error!;
        }
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
        // Demo session time (displayed time)
        lesson_time: formData.lessonTime,
        // Actual lesson time
        subject_id: formData.subject?.id || '',
        message: `Trial lesson request for ${formData.childName}`,
        referral_code: new URLSearchParams(window.location.search).get('ref')?.trim().toUpperCase() || undefined
      });
      if (!trialBookingResult.success) {
        throw new Error(trialBookingResult.error || 'Failed to submit trial booking request.');
      }
      toast({
        title: "Trial Booking Submitted!",
        description: "Your request has been submitted for review. We'll contact you within 24 hours."
      });
      navigate('/trial-booking-confirmation');
    } catch (err: any) {
      console.error('Error during trial booking submission:', err);
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
        return <SubjectSelectionStep selectedSubject={formData.subject} onSubjectChange={subject => updateFormData('subject', subject)} error={errors.subject} />;
      case 2:
        return <DateTimeSelector slots={slots} selectedDate={formData.date} selectedTime={formData.time} onDateSelect={date => updateFormData('date', date)} onTimeSelect={handleTimeSelect} isLoading={availabilityLoading} subjectId={formData.subject?.id} />;
      case 3:
        return <ContactInfoStep formData={formData} onChange={updateFormData} errors={errors} selectedSubject={formData.subject} selectedDate={formData.date} selectedTime={formData.time} />;
      default:
        return null;
    }
  };
  return <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-pastel-sky/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-pastel-blush/40 blur-3xl" />

      <div className="relative container mx-auto py-10 sm:py-14 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          {referrerName && (
            <span className="inline-flex items-center gap-2 rounded-full border border-foreground/80 bg-pastel-mint px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Invited by {referrerName}
            </span>
          )}
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {referrerName ? `${referrerName} has invited you to book a trial with Class Beyond Academy` : 'Book a Trial Lesson'}
          </h1>
          <svg viewBox="0 0 220 12" className="mx-auto mt-2 h-3 w-44 text-foreground/70" fill="none" aria-hidden="true">
            <path d="M3 8c30-7 60 4 90-1s60-6 124 2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Submit a request for a free 45-minute trial lesson with one of our qualified tutors
            {referrerName ? ' - and you both get £50 when the trial goes ahead' : ''}
          </p>
        </div>

        <div className="rounded-3xl border-2 border-foreground/90 bg-card p-4 sm:p-7 shadow-[0_6px_0_0_hsl(var(--foreground)/0.12)]">
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} stepLabels={stepLabels} />

          <div className="mt-6">
            {renderStep()}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-8 max-w-2xl mx-auto">
          <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1} className="rounded-full border-2 border-foreground/80 bg-transparent hover:bg-muted flex items-center justify-center gap-2 w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </div>

          {currentStep < totalSteps ? <Button type="button" onClick={handleNext} className="rounded-full bg-foreground text-background hover:bg-foreground/90 flex items-center justify-center gap-2 w-full sm:w-auto">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button> : <Button type="button" onClick={() => setShowConfirmDialog(true)} disabled={isSubmitting} className="rounded-full bg-foreground text-background hover:bg-foreground/90 flex items-center justify-center gap-2 w-full sm:w-auto">
              {isSubmitting ? <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </> : 'Submit Request'}
            </Button>}
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="cc-dialog rounded-3xl border-2 border-foreground/90 max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-foreground/80 bg-pastel-butter">
              <Sparkles className="h-5 w-5 text-foreground" />
            </span>
            <AlertDialogTitle className="font-heading text-xl text-left">Thank you for considering Class Beyond Academy</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-left">
              <span className="block rounded-2xl border border-border bg-muted/40 p-4">
                We're pleased to offer you a free trial lesson. Although there is no cost to you, your tutor sets aside this time especially for your child. We kindly ask that you only book a time that you are confident you can attend, so that no tutor time goes to waste and we can continue offering free trial lessons to other families.
              </span>
              <span className="block">
                Thank you for your understanding, and we look forward to welcoming you!
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} className="rounded-full border-2 border-foreground/80">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setShowConfirmDialog(false);
                handleSubmit();
              }}
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              Confirm Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>;

};
export default TrialBookingPage;