
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
}

interface HomeworkCompletionCheckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void; // Called after saving or skipping — opens AssignHomeworkDialog
  lessonId: string;
  students: Student[];
}

const HomeworkCompletionCheckDialog: React.FC<HomeworkCompletionCheckDialogProps> = ({
  isOpen,
  onClose,
  onComplete,
  lessonId,
  students,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previousHomework, setPreviousHomework] = useState<{ id: string; title: string } | null>(null);
  const [statuses, setStatuses] = useState<Record<number, string>>({});

  useEffect(() => {
    if (isOpen && lessonId) {
      fetchPreviousHomework();
    }
  }, [isOpen, lessonId]);

  const fetchPreviousHomework = async () => {
    setIsLoading(true);
    try {
      // Get the most recent homework for this lesson (excluding current)
      const { data, error } = await supabase
        .from('homework')
        .select('id, title')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // No previous homework — skip straight to AssignHomeworkDialog
        onComplete();
        return;
      }

      setPreviousHomework(data);
      // Initialize all students as unset
      const initial: Record<number, string> = {};
      students.forEach(s => { initial[s.id] = ''; });
      setStatuses(initial);
    } catch (err) {
      console.error('Error fetching previous homework:', err);
      // On error, just proceed to homework dialog
      onComplete();
    } finally {
      setIsLoading(false);
    }
  };

  const allMarked = students.every(s => statuses[s.id] && statuses[s.id] !== '');

  const handleSave = async () => {
    if (!previousHomework || !allMarked) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const rows = students.map(s => ({
        homework_id: previousHomework.id,
        student_id: s.id,
        status: statuses[s.id],
        marked_by: user.id,
      }));

      const { error } = await supabase
        .from('homework_completion_status')
        .upsert(rows, { onConflict: 'homework_id,student_id' });

      if (error) throw error;

      toast.success('Homework completion recorded');
      onComplete();
    } catch (err: any) {
      console.error('Error saving completion status:', err);
      toast.error('Failed to save completion status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!previousHomework) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Last Session's Homework</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Did the following students complete their homework: <span className="font-medium">{previousHomework.title}</span>?
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[50vh] overflow-y-auto">
          {students.map((student) => (
            <div key={student.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card">
              <span className="font-medium text-sm">
                {student.first_name} {student.last_name}
              </span>
              <RadioGroup
                value={statuses[student.id] || ''}
                onValueChange={(value) => setStatuses(prev => ({ ...prev, [student.id]: value }))}
                className="flex gap-3"
              >
                <div className="flex items-center gap-1">
                  <RadioGroupItem value="completed" id={`${student.id}-yes`} />
                  <Label htmlFor={`${student.id}-yes`} className="text-xs flex items-center gap-1 cursor-pointer">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Yes
                  </Label>
                </div>
                <div className="flex items-center gap-1">
                  <RadioGroupItem value="not_completed" id={`${student.id}-no`} />
                  <Label htmlFor={`${student.id}-no`} className="text-xs flex items-center gap-1 cursor-pointer">
                    <XCircle className="h-3 w-3 text-red-500" />
                    No
                  </Label>
                </div>
                <div className="flex items-center gap-1">
                  <RadioGroupItem value="excused" id={`${student.id}-excused`} />
                  <Label htmlFor={`${student.id}-excused`} className="text-xs flex items-center gap-1 cursor-pointer">
                    <MinusCircle className="h-3 w-3 text-amber-500" />
                    Excused
                  </Label>
                </div>
              </RadioGroup>
            </div>
          ))}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleSkip} disabled={isSaving}>
            Skip
          </Button>
          <Button onClick={handleSave} disabled={!allMarked || isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HomeworkCompletionCheckDialog;
