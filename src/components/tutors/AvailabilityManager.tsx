
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { TutorAvailability, DayOfWeek, weekDays, displayWeekDays } from '@/types/availability';
import { Tutor } from '@/types/tutor';

interface AvailabilityManagerProps {
  tutor: Tutor;
  isEditable?: boolean;
}

interface TimeSlot {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  id?: string;
}

const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({ tutor, isEditable = true }) => {
  const [availabilities, setAvailabilities] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, [tutor.id]);

  const fetchAvailability = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tutor_availability')
        .select('*')
        .eq('tutor_id', tutor.id);

      if (error) throw error;

      const formattedData = data.map((item: TutorAvailability) => ({
        day: item.day_of_week,
        startTime: item.start_time.substring(0, 5), // Format time as HH:MM
        endTime: item.end_time.substring(0, 5), // Format time as HH:MM
        id: item.id
      }));

      setAvailabilities(formattedData);
    } catch (error: any) {
      console.error('Error fetching tutor availability:', error);
      toast.error('Failed to load availability data');
    } finally {
      setIsLoading(false);
    }
  };

  const addTimeSlot = () => {
    setAvailabilities([
      ...availabilities,
      { day: 'monday', startTime: '09:00', endTime: '17:00' }
    ]);
  };

  const removeTimeSlot = (index: number) => {
    const updatedSlots = [...availabilities];
    const removedSlot = updatedSlots.splice(index, 1)[0];

    // If this slot has an ID, delete it from the database
    if (removedSlot.id) {
      deleteTimeSlot(removedSlot.id);
    }

    setAvailabilities(updatedSlots);
  };

  const deleteTimeSlot = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tutor_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting time slot:', error);
      toast.error('Failed to delete time slot');
    }
  };

  const handleDayChange = (value: DayOfWeek, index: number) => {
    const updatedSlots = [...availabilities];
    updatedSlots[index].day = value;
    setAvailabilities(updatedSlots);
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string, index: number) => {
    const updatedSlots = [...availabilities];
    updatedSlots[index][field] = value;
    setAvailabilities(updatedSlots);
  };

  const saveAvailability = async () => {
    if (!isEditable) return;

    try {
      setIsSaving(true);

      // Validate time slots
      for (const slot of availabilities) {
        if (slot.startTime >= slot.endTime) {
          toast.error('End time must be after start time');
          return;
        }
      }

      // Process existing slots with IDs
      const existingSlots = availabilities.filter(slot => slot.id);
      
      // Process new slots without IDs
      const newSlots = availabilities.filter(slot => !slot.id);

      // Update existing slots
      for (const slot of existingSlots) {
        const { error } = await supabase
          .from('tutor_availability')
          .update({
            day_of_week: slot.day,
            start_time: slot.startTime,
            end_time: slot.endTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', slot.id);

        if (error) throw error;
      }

      // Add new slots
      if (newSlots.length > 0) {
        const { error } = await supabase
          .from('tutor_availability')
          .insert(
            newSlots.map(slot => ({
              tutor_id: tutor.id,
              day_of_week: slot.day,
              start_time: slot.startTime,
              end_time: slot.endTime,
              organization_id: tutor.organization_id
            }))
          );

        if (error) throw error;
      }

      toast.success('Availability saved successfully');
      fetchAvailability(); // Refresh data
    } catch (error: any) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Weekly Availability</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {availabilities.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>No availability set up yet.</p>
                {isEditable && (
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={addTimeSlot}
                  >
                    Add Time Slot
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {availabilities.map((slot, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-3 pb-4">
                    <div className="w-full md:w-auto">
                      <Select
                        value={slot.day}
                        onValueChange={(value) => handleDayChange(value as DayOfWeek, index)}
                        disabled={!isEditable}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {weekDays.map((day) => (
                            <SelectItem key={day} value={day}>
                              {displayWeekDays[day]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground mb-1">Start</span>
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => handleTimeChange('startTime', e.target.value, index)}
                          className="px-3 py-1 rounded-md border border-input bg-background"
                          disabled={!isEditable}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground mb-1">End</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => handleTimeChange('endTime', e.target.value, index)}
                          className="px-3 py-1 rounded-md border border-input bg-background"
                          disabled={!isEditable}
                        />
                      </div>
                    </div>

                    {isEditable && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimeSlot(index)}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {index < availabilities.length - 1 && (
                      <Separator className="w-full mt-2" />
                    )}
                  </div>
                ))}

                {isEditable && (
                  <div className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addTimeSlot}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Time Slot
                    </Button>
                    
                    <Button
                      onClick={saveAvailability}
                      disabled={isSaving}
                      className="ml-auto"
                      size="sm"
                    >
                      {isSaving ? 'Saving...' : 'Save Availability'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilityManager;
