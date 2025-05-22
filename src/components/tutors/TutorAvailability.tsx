
import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TimeInput } from '@/components/ui/time-input';
import { Plus, Trash2 } from 'lucide-react';

export type AvailabilitySlot = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
};

interface TutorAvailabilityProps {
  value: AvailabilitySlot[];
  onChange: (value: AvailabilitySlot[]) => void;
}

const DAYS_OF_WEEK = [
  { label: 'Monday', value: 'monday' },
  { label: 'Tuesday', value: 'tuesday' },
  { label: 'Wednesday', value: 'wednesday' },
  { label: 'Thursday', value: 'thursday' },
  { label: 'Friday', value: 'friday' },
  { label: 'Saturday', value: 'saturday' },
  { label: 'Sunday', value: 'sunday' },
];

export const TutorAvailability: React.FC<TutorAvailabilityProps> = ({ value, onChange }) => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(value || []);

  const addSlot = () => {
    const newSlot: AvailabilitySlot = {
      id: crypto.randomUUID(),
      day: '',
      startTime: '09:00',
      endTime: '17:00',
    };
    
    const updatedSlots = [...slots, newSlot];
    setSlots(updatedSlots);
    onChange(updatedSlots);
  };

  const removeSlot = (slotId: string) => {
    const updatedSlots = slots.filter(slot => slot.id !== slotId);
    setSlots(updatedSlots);
    onChange(updatedSlots);
  };

  const updateSlot = (slotId: string, field: keyof AvailabilitySlot, value: string) => {
    const updatedSlots = slots.map(slot => {
      if (slot.id === slotId) {
        return { ...slot, [field]: value };
      }
      return slot;
    });
    
    setSlots(updatedSlots);
    onChange(updatedSlots);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium">Weekly Availability</h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={addSlot}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Time Slot
        </Button>
      </div>
      
      {slots.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No availability set. Add time slots to indicate when the tutor is available.</p>
      )}
      
      <div className="space-y-3">
        {slots.map((slot) => (
          <div key={slot.id} className="flex flex-wrap gap-3 items-end border rounded-md p-3">
            <div className="w-full sm:w-auto">
              <FormLabel className="text-xs">Day</FormLabel>
              <Select
                value={slot.day}
                onValueChange={(value) => updateSlot(slot.id, 'day', value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto flex flex-wrap gap-3">
              <div>
                <FormLabel className="text-xs">Start Time</FormLabel>
                <TimeInput
                  value={slot.startTime}
                  onChange={(e) => updateSlot(slot.id, 'startTime', e.target.value)}
                />
              </div>
              
              <div>
                <FormLabel className="text-xs">End Time</FormLabel>
                <TimeInput
                  value={slot.endTime}
                  onChange={(e) => updateSlot(slot.id, 'endTime', e.target.value)}
                />
              </div>
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeSlot(slot.id)}
              className="text-destructive ml-auto mb-0"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remove time slot</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
