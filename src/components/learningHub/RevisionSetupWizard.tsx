import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, BookOpen, Target } from 'lucide-react';
import { format } from 'date-fns';
import { paymentService } from '@/services/paymentService';
import { learningHubService } from '@/services/learningHubService';
import { revisionCalendarService } from '@/services/revisionCalendarService';
import { RevisionSetupData } from '@/types/revision';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface RevisionSetupWizardProps {
  onComplete: () => void;
  onCancel: () => void;
  worstTopics?: any[];
  worstTopicsLoading?: boolean;
}

const RevisionSetupWizard: React.FC<RevisionSetupWizardProps> = ({ onComplete, onCancel, worstTopics, worstTopicsLoading }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState<RevisionSetupData>({
    selectedDays: [],
    weeklyHours: 5,
    selectedSubjects: [],
    startDate: new Date(),
    name: 'My Revision Schedule'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch purchased courses
  const { data: purchasedCourses } = useQuery({
    queryKey: ['purchased-courses'],
    queryFn: paymentService.getUserPurchases,
  });

  // Fetch all courses for details
  const { data: allCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: learningHubService.getCourses,
  });

  const daysOfWeek = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' }
  ];

  // Get available subjects from purchased courses
  const availableSubjects = React.useMemo(() => {
    if (!purchasedCourses || !allCourses) return [];
    
    const subjectSet = new Set<string>();
    purchasedCourses.forEach(purchase => {
      const course = allCourses.find(c => c.id === purchase.course_id);
      if (course?.subject) {
        subjectSet.add(course.subject);
      }
    });
    
    return Array.from(subjectSet);
  }, [purchasedCourses, allCourses]);

  const subjectWeakness = useMemo(() => {
    if (!worstTopics) return {};
    const weakness: { [subject: string]: { totalErrorRate: number; count: number } } = {};
    worstTopics.forEach(topic => {
      if (!weakness[topic.subject]) {
        weakness[topic.subject] = { totalErrorRate: 0, count: 0 };
      }
      weakness[topic.subject].totalErrorRate += topic.errorRate;
      weakness[topic.subject].count += 1;
    });

    const result: { [subject: string]: { avgErrorRate: number; topics: number } } = {};
    for (const subject in weakness) {
      result[subject] = {
        avgErrorRate: Math.round(weakness[subject].totalErrorRate / weakness[subject].count),
        topics: weakness[subject].count
      };
    }
    return result;
  }, [worstTopics]);

  useEffect(() => {
    if (currentStep === 3 && availableSubjects.length > 0 && worstTopics && Object.keys(subjectWeakness).length > 0) {
      const weakSubjects = availableSubjects.filter(subject => subjectWeakness[subject]?.avgErrorRate > 40);
      if (weakSubjects.length > 0) {
        setSetupData(prev => ({
          ...prev,
          selectedSubjects: Array.from(new Set([...prev.selectedSubjects, ...weakSubjects]))
        }));
      }
    }
  }, [currentStep, availableSubjects, worstTopics, subjectWeakness]);

  const handleDayToggle = (dayId: string) => {
    setSetupData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayId)
        ? prev.selectedDays.filter(d => d !== dayId)
        : [...prev.selectedDays, dayId]
    }));
  };

  const handleSubjectToggle = (subject: string) => {
    setSetupData(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subject)
        ? prev.selectedSubjects.filter(s => s !== subject)
        : [...prev.selectedSubjects, subject]
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await revisionCalendarService.createRevisionSchedule(setupData);
      onComplete();
    } catch (error) {
      console.error('Failed to create revision schedule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return setupData.selectedDays.length > 0;
      case 2:
        return setupData.weeklyHours > 0;
      case 3:
        return setupData.selectedSubjects.length > 0;
      case 4:
        return setupData.name.trim().length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Create Revision Schedule
          </CardTitle>
          <CardDescription>
            Step {currentStep} of 4: Set up your personalized revision calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Select Your Revision Days</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {daysOfWeek.map(day => (
                    <div
                      key={day.id}
                      className={cn(
                        "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors",
                        setupData.selectedDays.includes(day.id)
                          ? "bg-primary/10 border-primary"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      )}
                      onClick={() => handleDayToggle(day.id)}
                    >
                      <Checkbox
                        id={day.id}
                        checked={setupData.selectedDays.includes(day.id)}
                        onChange={() => handleDayToggle(day.id)}
                      />
                      <Label htmlFor={day.id} className="cursor-pointer">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Weekly Study Hours</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="weeklyHours">Hours per week</Label>
                    <Input
                      id="weeklyHours"
                      type="number"
                      min="1"
                      max="40"
                      value={setupData.weeklyHours}
                      onChange={(e) => setSetupData(prev => ({
                        ...prev,
                        weeklyHours: parseInt(e.target.value) || 0
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Schedule Preview</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      {setupData.selectedDays.length > 0 && setupData.weeklyHours > 0 ? (
                        `~${Math.round((setupData.weeklyHours / setupData.selectedDays.length) * 60)} minutes per session`
                      ) : (
                        'Select days and hours to see preview'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Select Subjects to Revise</h3>
                {worstTopicsLoading && <p className="text-sm text-gray-500">Analyzing performance...</p>}
                {worstTopics && Object.keys(subjectWeakness).length > 0 && (
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
                        <h4 className="font-medium text-amber-900 mb-2">Smart Recommendation</h4>
                        <p className="text-sm text-amber-800">We've pre-selected subjects where you have the most room for improvement.</p>
                    </div>
                )}
                {availableSubjects.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No purchased courses found</p>
                    <p className="text-sm text-gray-500">Purchase courses first to create revision schedules</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableSubjects.map(subject => (
                      <div
                        key={subject}
                        className={cn(
                          "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors",
                          setupData.selectedSubjects.includes(subject)
                            ? "bg-primary/10 border-primary"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        )}
                        onClick={() => handleSubjectToggle(subject)}
                      >
                        <Checkbox
                          id={subject}
                          checked={setupData.selectedSubjects.includes(subject)}
                          onChange={() => handleSubjectToggle(subject)}
                        />
                        <Label htmlFor={subject} className="cursor-pointer flex-grow">
                          {subject}
                        </Label>
                        {subjectWeakness[subject] && (
                          <Badge variant="destructive" className="ml-2">
                            {subjectWeakness[subject].avgErrorRate}% error
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Schedule Details</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="scheduleName">Schedule Name</Label>
                    <Input
                      id="scheduleName"
                      value={setupData.name}
                      onChange={(e) => setSetupData(prev => ({
                        ...prev,
                        name: e.target.value
                      }))}
                      placeholder="My Revision Schedule"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !setupData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {setupData.startDate ? format(setupData.startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={setupData.startDate}
                          onSelect={(date) => date && setSetupData(prev => ({ ...prev, startDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Schedule Summary</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• {setupData.selectedDays.length} days per week</li>
                      <li>• {setupData.weeklyHours} hours total per week</li>
                      <li>• {setupData.selectedSubjects.length} subjects selected</li>
                      <li>• Starting {format(setupData.startDate, "MMM dd, yyyy")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? onCancel : () => setCurrentStep(prev => prev - 1)}
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            {currentStep < 4 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Schedule'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevisionSetupWizard;
