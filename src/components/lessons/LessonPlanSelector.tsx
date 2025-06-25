
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Calendar, Clock } from 'lucide-react';
import { useLessonPlans, LessonPlan } from '@/hooks/useLessonPlans';

interface LessonPlanSelectorProps {
  lessonId: string;
  subject: string;
  lessonDate: string;
  onPlanAssigned?: () => void;
  children: React.ReactNode;
}

const LessonPlanSelector: React.FC<LessonPlanSelectorProps> = ({
  lessonId,
  subject,
  lessonDate,
  onPlanAssigned,
  children
}) => {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);
  const [suggestedPlan, setSuggestedPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { lessonPlans, assignLessonPlan, suggestLessonPlanForDate, fetchLessonPlans } = useLessonPlans();

  useEffect(() => {
    if (open && subject) {
      fetchLessonPlans(subject);
      suggestLessonPlanForDate(subject, lessonDate).then(setSuggestedPlan);
    }
  }, [open, subject, lessonDate, fetchLessonPlans, suggestLessonPlanForDate]);

  const handleAssignPlan = async () => {
    if (!selectedPlan) return;

    try {
      setLoading(true);
      await assignLessonPlan(lessonId, selectedPlan.id, lessonDate);
      setOpen(false);
      onPlanAssigned?.();
    } catch (error) {
      console.error('Error assigning lesson plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTermColor = (term: string) => {
    switch (term.toLowerCase()) {
      case 'autumn': return 'bg-orange-100 text-orange-800';
      case 'spring': return 'bg-green-100 text-green-800';
      case 'summer': return 'bg-blue-100 text-blue-800';
      case 'winter': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPlans = lessonPlans.filter(plan => 
    plan.subject === subject || 
    (subject.includes('Chemistry') && plan.subject.includes('Chemistry'))
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Lesson Plan for {subject}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {suggestedPlan && (
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">Suggested for this week</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Week {suggestedPlan.week_number}: {suggestedPlan.topic_title}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">{suggestedPlan.description}</p>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => setSelectedPlan(suggestedPlan)}
                    variant={selectedPlan?.id === suggestedPlan.id ? "default" : "outline"}
                  >
                    {selectedPlan?.id === suggestedPlan.id ? 'Selected' : 'Use Suggested'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-3">All Available Lesson Plans</h4>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPlan?.id === plan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            Week {plan.week_number}
                          </Badge>
                          <Badge className={`text-xs ${getTermColor(plan.term)}`}>
                            {plan.term}
                          </Badge>
                        </div>
                        <h5 className="font-medium text-sm">{plan.topic_title}</h5>
                        {plan.description && (
                          <p className="text-xs text-gray-600 mt-1">{plan.description}</p>
                        )}
                      </div>
                      {selectedPlan?.id === plan.id && (
                        <div className="text-blue-600">
                          <Clock className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignPlan}
              disabled={!selectedPlan || loading}
            >
              {loading ? 'Assigning...' : 'Assign Lesson Plan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonPlanSelector;
