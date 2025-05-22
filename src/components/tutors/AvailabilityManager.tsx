
import React, { useState, useEffect } from 'react';
import { DayOfWeek, TutorAvailability } from '@/types/availability';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

interface AvailabilityManagerProps {
  tutorId: string;
  isDisabled?: boolean;
}

const dayOptions: { label: string; value: DayOfWeek }[] = [
  { label: 'Monday', value: 'monday' },
  { label: 'Tuesday', value: 'tuesday' },
  { label: 'Wednesday', value: 'wednesday' },
  { label: 'Thursday', value: 'thursday' },
  { label: 'Friday', value: 'friday' },
  { label: 'Saturday', value: 'saturday' },
  { label: 'Sunday', value: 'sunday' },
];

const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({ tutorId, isDisabled = false }) => {
  const [availabilities, setAvailabilities] = useState<TutorAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const { organization } = useOrganization();
  
  useEffect(() => {
    if (tutorId) {
      fetchAvailability();
    } else {
      // For new tutors, start with an empty slot
      setAvailabilities([
        {
          id: 'new-' + Date.now(),
          tutor_id: '',
          day_of_week: 'monday',
          start_time: '09:00',
          end_time: '17:00',
        } as TutorAvailability
      ]);
    }
  }, [tutorId]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tutor_availability')
        .select('*')
        .eq('tutor_id', tutorId);

      if (error) throw error;

      const typedData = data as TutorAvailability[];
      setAvailabilities(typedData.length > 0 ? typedData : [
        {
          id: 'new-' + Date.now(),
          tutor_id: tutorId,
          day_of_week: 'monday' as DayOfWeek,
          start_time: '09:00',
          end_time: '17:00',
        }
      ]);
    } catch (error: any) {
      console.error('Error fetching tutor availability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const addAvailability = () => {
    setAvailabilities([
      ...availabilities,
      {
        id: 'new-' + Date.now(),
        tutor_id: tutorId,
        day_of_week: 'monday' as DayOfWeek,
        start_time: '09:00',
        end_time: '17:00',
      }
    ]);
  };

  const removeAvailability = (index: number) => {
    if (availabilities.length === 1) {
      toast.error('Tutor must have at least one availability slot');
      return;
    }
    
    const newAvailabilities = [...availabilities];
    newAvailabilities.splice(index, 1);
    setAvailabilities(newAvailabilities);
  };

  const updateAvailability = (index: number, field: keyof TutorAvailability, value: any) => {
    const newAvailabilities = [...availabilities];
    newAvailabilities[index] = {
      ...newAvailabilities[index],
      [field]: value
    };
    setAvailabilities(newAvailabilities);
  };

  const validateAvailabilities = () => {
    for (const avail of availabilities) {
      if (!avail.day_of_week || !avail.start_time || !avail.end_time) {
        return false;
      }
      
      // Check if end time is after start time
      if (avail.start_time >= avail.end_time) {
        return false;
      }
    }
    return true;
  };

  const saveAvailabilities = async () => {
    if (!validateAvailabilities()) {
      toast.error('Please check all availability slots. End time must be after start time.');
      return false;
    }

    try {
      // Process each availability
      for (const avail of availabilities) {
        const isNew = avail.id.startsWith('new-');
        
        if (isNew) {
          // Insert new availability
          const { error } = await supabase
            .from('tutor_availability')
            .insert({
              tutor_id: tutorId,
              day_of_week: avail.day_of_week,
              start_time: avail.start_time,
              end_time: avail.end_time,
              organization_id: organization?.id
            });
          
          if (error) throw error;
        } else {
          // Update existing availability
          const { error } = await supabase
            .from('tutor_availability')
            .update({
              day_of_week: avail.day_of_week,
              start_time: avail.start_time,
              end_time: avail.end_time,
              organization_id: organization?.id
            })
            .eq('id', avail.id);
          
          if (error) throw error;
        }
      }
      
      toast.success('Availability updated successfully');
      return true;
    } catch (error: any) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Weekly Availability</h3>
        <p className="text-sm text-muted-foreground">Set the tutor's regular weekly schedule.</p>
      </div>

      {availabilities.map((avail, index) => (
        <div key={avail.id} className="grid grid-cols-12 gap-2 items-center border p-3 rounded-md">
          <div className="col-span-4">
            <Label htmlFor={`day-${index}`}>Day</Label>
            <Select
              disabled={isDisabled}
              value={avail.day_of_week}
              onValueChange={(value) => updateAvailability(index, 'day_of_week', value as DayOfWeek)}
            >
              <SelectTrigger id={`day-${index}`}>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map(day => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-3">
            <Label htmlFor={`start-${index}`}>Start Time</Label>
            <Input
              disabled={isDisabled}
              id={`start-${index}`}
              type="time"
              value={avail.start_time}
              onChange={(e) => updateAvailability(index, 'start_time', e.target.value)}
            />
          </div>
          
          <div className="col-span-3">
            <Label htmlFor={`end-${index}`}>End Time</Label>
            <Input
              disabled={isDisabled}
              id={`end-${index}`}
              type="time"
              value={avail.end_time}
              onChange={(e) => updateAvailability(index, 'end_time', e.target.value)}
            />
          </div>
          
          <div className="col-span-2 flex justify-center items-end pt-3">
            <Button
              disabled={isDisabled || availabilities.length === 1}
              variant="ghost"
              size="icon"
              onClick={() => removeAvailability(index)}
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addAvailability}
          disabled={isDisabled}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Time Slot
        </Button>
      </div>
    </div>
  );
};

export default AvailabilityManager;
