import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Plus, X } from 'lucide-react';
import { Tutor, AvailabilitySlot } from '@/types/tutor';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SubjectSelector from './SubjectSelector';
import MultiSelectSubjects from './MultiSelectSubjects';

interface EditTutorFormProps {
  tutor: Tutor | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (tutor: Tutor) => void;
}

// Updated schema with subjectIds
const formSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
  bio: z.string().optional(),
  status: z.string(),
  normal_hourly_rate: z.number().min(0, { message: "Hourly rate must be positive." }),
  absence_hourly_rate: z.number().optional(), // No validation as it's auto-calculated
  subjectIds: z.array(z.string()).default([]),
  availability: z.array(z.object({
    id: z.string(),
    day_of_week: z.string(),
    start_time: z.string(),
    end_time: z.string(),
    tutor_id: z.string().optional()
  })).optional()
});

type FormData = z.infer<typeof formSchema>;

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const EditTutorForm: React.FC<EditTutorFormProps> = ({ tutor, isOpen, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [deletedAvailabilityIds, setDeletedAvailabilityIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      bio: "",
      status: 'active',
      normal_hourly_rate: 25.00,
      absence_hourly_rate: 12.50,
      subjectIds: [],
      availability: []
    },
  });

  const fetchAvailability = async (tutorId: string) => {
    if (!tutorId) return;

    const { data, error } = await supabase
      .from('tutor_availability')
      .select('*')
      .eq('tutor_id', tutorId);

    if (error) {
      console.error('Error fetching availability:', error);
      return;
    }

    if (data) {
      const formattedData = data.map(slot => ({
        id: slot.id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time.substring(0, 5), // Format time to HH:MM
        end_time: slot.end_time.substring(0, 5), // Format time to HH:MM
        tutor_id: slot.tutor_id
      }));

      setAvailabilitySlots(formattedData);
      form.setValue('availability', formattedData);
    }
  };

  const fetchTutorSubjects = async (tutorId: string) => {
    if (!tutorId) return;

    const { data, error } = await supabase
      .from('tutor_subjects')
      .select('subject_id')
      .eq('tutor_id', tutorId);

    if (error) {
      console.error('Error fetching tutor subjects:', error);
      return;
    }

    if (data) {
      const subjectIds = data.map(ts => ts.subject_id);
      setSelectedSubjectIds(subjectIds);
      form.setValue('subjectIds', subjectIds);
    }
  };

  // Set form values when tutor changes
  useEffect(() => {
    if (tutor) {
      const normalRate = tutor.normal_hourly_rate || 25.00;
      const calculatedAbsenceRate = Number(((normalRate / 60) * 15).toFixed(2));
      
      form.reset({
        first_name: tutor.first_name,
        last_name: tutor.last_name,
        email: tutor.email,
        phone: tutor.phone || "",
        bio: tutor.bio || "",
        status: tutor.status,
        normal_hourly_rate: normalRate,
        absence_hourly_rate: calculatedAbsenceRate,
        subjectIds: [],
        availability: []
      });
      
      fetchAvailability(tutor.id);
      fetchTutorSubjects(tutor.id);
    }
  }, [tutor, form]);

  // Auto-calculate absence hourly rate when normal hourly rate changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'normal_hourly_rate' && value.normal_hourly_rate !== undefined) {
        const calculatedRate = Number(((value.normal_hourly_rate / 60) * 15).toFixed(2));
        form.setValue('absence_hourly_rate', calculatedRate);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const addAvailabilitySlot = () => {
    const newSlot: AvailabilitySlot = {
      id: uuidv4(),
      day_of_week: 'Monday',
      start_time: '09:00',
      end_time: '17:00'
    };
    
    setAvailabilitySlots([...availabilitySlots, newSlot]);
    form.setValue('availability', [...availabilitySlots, newSlot]);
  };

  const removeAvailabilitySlot = (id: string) => {
    const slotToRemove = availabilitySlots.find(slot => slot.id === id);
    
    // If this is an existing slot from the database (has tutor_id), mark it for deletion
    if (slotToRemove?.tutor_id) {
      setDeletedAvailabilityIds([...deletedAvailabilityIds, id]);
    }
    
    const updatedSlots = availabilitySlots.filter(slot => slot.id !== id);
    setAvailabilitySlots(updatedSlots);
    form.setValue('availability', updatedSlots);
  };

  const updateAvailabilitySlot = (id: string, field: keyof AvailabilitySlot, value: string) => {
    const updatedSlots = availabilitySlots.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    );
    setAvailabilitySlots(updatedSlots);
    form.setValue('availability', updatedSlots);
  };

  const onSubmit = async (data: FormData) => {
    if (!tutor) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tutors')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          bio: data.bio,
          status: data.status,
          normal_hourly_rate: data.normal_hourly_rate,
          absence_hourly_rate: data.absence_hourly_rate
        })
        .eq('id', tutor.id);
        
      if (error) throw error;

      // Handle subject updates
      if (data.subjectIds) {
        // First, delete all existing tutor-subject relationships
        const { error: deleteError } = await supabase
          .from('tutor_subjects')
          .delete()
          .eq('tutor_id', tutor.id);
          
        if (deleteError) console.error('Error deleting existing tutor subjects:', deleteError);

        // Then insert new relationships
        if (data.subjectIds.length > 0) {
          const tutorSubjects = data.subjectIds.map(subjectId => ({
            tutor_id: tutor.id,
            subject_id: subjectId
          }));

          const { error: insertError } = await supabase
            .from('tutor_subjects')
            .insert(tutorSubjects);
            
          if (insertError) console.error('Error inserting tutor subjects:', insertError);
        }
      }

      // Handle availability updates
      if (data.availability && data.availability.length > 0) {
        // 1. First delete any slots marked for deletion
        if (deletedAvailabilityIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('tutor_availability')
            .delete()
            .in('id', deletedAvailabilityIds);
            
          if (deleteError) console.error('Error deleting availability slots:', deleteError);
        }

        // 2. Update or insert availability slots
        for (const slot of data.availability) {
          if (slot.tutor_id) {
            // This is an existing slot, update it
            const { error: updateError } = await supabase
              .from('tutor_availability')
              .update({
                day_of_week: slot.day_of_week,
                start_time: slot.start_time,
                end_time: slot.end_time
              })
              .eq('id', slot.id);
              
            if (updateError) console.error('Error updating availability slot:', updateError);
          } else {
            // This is a new slot, insert it
            const { error: insertError } = await supabase
              .from('tutor_availability')
              .insert({
                tutor_id: tutor.id,
                day_of_week: slot.day_of_week,
                start_time: slot.start_time,
                end_time: slot.end_time
              });
              
            if (insertError) console.error('Error inserting availability slot:', insertError);
          }
        }
      }
      
      // Update the tutor in the parent component
      const updatedTutor: Tutor = {
        ...tutor,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        status: data.status,
        normal_hourly_rate: data.normal_hourly_rate,
        absence_hourly_rate: data.absence_hourly_rate,
        availability: availabilitySlots
      };
      
      onUpdate(updatedTutor);
      onClose();
      toast.success("Tutor updated successfully");
    } catch (error: any) {
      console.error('Error updating tutor:', error);
      toast.error(error.message || "Failed to update tutor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tutor</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(123) 456-7890" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the tutor's background and experience..." 
                      className="min-h-[100px]" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subject Selection */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="subjectIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subjects</FormLabel>
                    <FormControl>
                      <MultiSelectSubjects
                        selectedSubjectIds={field.value}
                        onSubjectsChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Availability Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Availability Schedule</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addAvailabilitySlot}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Time Slot
                </Button>
              </div>
              
              {availabilitySlots.length === 0 ? (
                <div className="text-center py-4 border border-dashed rounded-md text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto opacity-50 mb-2" />
                  <p>No availability schedules added yet.</p>
                  <p className="text-sm">Click "Add Time Slot" to specify when this tutor is available.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availabilitySlots.map((slot) => (
                    <div key={slot.id} className="flex items-center gap-2 p-3 border rounded-md bg-muted/20">
                      <div className="flex-1">
                        <Select 
                          value={slot.day_of_week} 
                          onValueChange={(value) => updateAvailabilitySlot(slot.id, 'day_of_week', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {daysOfWeek.map((day) => (
                              <SelectItem key={day} value={day}>{day}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Input 
                          type="time" 
                          value={slot.start_time} 
                          onChange={(e) => updateAvailabilitySlot(slot.id, 'start_time', e.target.value)} 
                        />
                      </div>
                      <div className="flex-1">
                        <Input 
                          type="time" 
                          value={slot.end_time} 
                          onChange={(e) => updateAvailabilitySlot(slot.id, 'end_time', e.target.value)} 
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeAvailabilitySlot(slot.id)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="normal_hourly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Normal Hourly Rate (£)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="25.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="absence_hourly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Absence Hourly Rate (£)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="6.25" 
                        {...field}
                        disabled
                        className="bg-muted text-muted-foreground cursor-not-allowed"
                        title="Auto-calculated: (Normal Rate ÷ 60) × 15"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-calculated based on normal hourly rate
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Tutor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTutorForm;
