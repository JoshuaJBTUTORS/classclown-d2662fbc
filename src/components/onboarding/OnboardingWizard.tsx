import { useState } from "react";
import { WelcomeStep } from "./WelcomeStep";
import { RegionSelectionStep } from "./RegionSelectionStep";
import { SubjectSelectionStep } from "./SubjectSelectionStep";
import { CourseMatchingStep } from "./CourseMatchingStep";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { OnboardingData, Region, Curriculum } from "@/types/onboarding";
import { AVAILABLE_SUBJECTS } from "@/types/onboarding";

const STEPS = ['welcome', 'region', 'subjects', 'matching'] as const;
type Step = typeof STEPS[number];

export const OnboardingWizard = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [data, setData] = useState<Partial<OnboardingData>>({});

  const stepIndex = STEPS.indexOf(currentStep);

  const handleRegionSelect = async (region: Region) => {
    const curriculumMap: Record<Region, Curriculum> = {
      england: 'english',
      scotland: 'scottish',
      wales: 'welsh',
    };

    // Set default year group based on region
    const defaultYearName = region === 'scotland' ? 'S4' : 'Year 10';
    const { data: yearGroupData } = await supabase
      .from('curriculum_year_groups')
      .select('year_group_id, year_groups(id)')
      .eq('curriculum', curriculumMap[region])
      .eq('display_name', defaultYearName)
      .single();

    setData({
      ...data,
      region,
      curriculum: curriculumMap[region],
      yearGroupId: yearGroupData?.year_groups?.id || '',
    });
    setCurrentStep('subjects');
  };

  const handleSubjectToggle = (subject: string) => {
    const currentSubjects = data.subjects || [];
    const newSubjects = currentSubjects.includes(subject)
      ? currentSubjects.filter(s => s !== subject)
      : [...currentSubjects, subject];
    
    setData({ ...data, subjects: newSubjects });
  };

  const handleSelectAllSubjects = () => {
    const currentSubjects = data.subjects || [];
    const allSelected = currentSubjects.length === AVAILABLE_SUBJECTS.length;
    
    setData({
      ...data,
      subjects: allSelected ? [] : [...AVAILABLE_SUBJECTS],
    });
  };

  const handleSubjectsNext = () => {
    if (!data.subjects || data.subjects.length === 0) {
      return;
    }
    setCurrentStep('matching');
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const canGoBack = stepIndex > 0 && currentStep !== 'matching';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8">
        {/* Progress indicator */}
        {currentStep !== 'welcome' && currentStep !== 'matching' && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Step {stepIndex} of {STEPS.length - 2}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(stepIndex / (STEPS.length - 2)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Back button */}
        {canGoBack && (
          <div className="max-w-4xl mx-auto mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        )}

        {/* Step content */}
        <div className="py-8">
          {currentStep === 'welcome' && (
            <WelcomeStep onNext={() => setCurrentStep('region')} />
          )}

          {currentStep === 'region' && (
            <RegionSelectionStep
              selectedRegion={data.region}
              onSelect={handleRegionSelect}
            />
          )}

          {currentStep === 'subjects' && (
            <div>
              <SubjectSelectionStep
                selectedSubjects={data.subjects || []}
                onToggle={handleSubjectToggle}
                onSelectAll={handleSelectAllSubjects}
              />
              <div className="flex justify-center mt-8">
                <Button
                  size="lg"
                  onClick={handleSubjectsNext}
                  disabled={!data.subjects || data.subjects.length === 0}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'matching' && user && data.subjects && data.yearGroupId && data.curriculum && (
            <CourseMatchingStep
              data={data as OnboardingData}
              userId={user.id}
            />
          )}
        </div>
      </div>
    </div>
  );
};
