
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Repeat } from 'lucide-react';
import { useRecurringLessons } from '@/hooks/useRecurringLessons';

interface RecurringLessonDialogProps {
  lessonId: string;
  lessonTitle: string;
  children: React.ReactNode;
}

const RecurringLessonDialog: React.FC<RecurringLessonDialogProps> = ({
  lessonId,
  lessonTitle,
  children
}) => {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState(`${lessonTitle} - Recurring`);
  const [interval, setInterval] = useState('weekly');
  const [loading, setLoading] = useState(false);
  const { createRecurringGroup } = useRecurringLessons();

  const handleCreateRecurring = async () => {
    try {
      setLoading(true);
      
      const pattern = {
        interval,
        createdAt: new Date().toISOString()
      };

      await createRecurringGroup(lessonId, groupName, pattern);
      setOpen(false);
      
      // Reset form
      setGroupName(`${lessonTitle} - Recurring`);
      setInterval('weekly');
    } catch (error) {
      console.error('Error creating recurring lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Make Lesson Recurring
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Creating Recurring Lessons</h4>
                <p className="text-sm text-blue-700 mt-1">
                  This will create a series of lessons for the next 3 months based on your selected interval. 
                  The system will automatically extend these lessons every 3 months.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter a name for this recurring lesson series"
              />
            </div>

            <div>
              <Label htmlFor="interval">Recurrence Interval</Label>
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Important Note</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This will create individual lesson instances that can be modified independently. 
                  Students enrolled in the original lesson will be automatically enrolled in all recurring instances.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRecurring}
              disabled={loading || !groupName.trim()}
            >
              {loading ? 'Creating...' : 'Create Recurring Lessons'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringLessonDialog;
