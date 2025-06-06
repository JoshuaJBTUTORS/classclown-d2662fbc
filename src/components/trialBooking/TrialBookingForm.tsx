
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, User, Mail, Phone, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { YearGroup, TutorAvailabilitySlot } from '@/types/trialBooking';

interface TrialBookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const formSchema = z.object({
  parent_name: z.string().min(2, { message: "Parent name must be at least 2 characters." }),
  child_name: z.string().min(2, { message: "Child name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email format." }),
  phone: z.string().optional(),
  year_group_id: z.string().min(1, { message: "Please select a year group." }),
  subject_id: z.string().min(1, { message: "Please select a subject." }),
  tutor_id: z.string().optional(),
  preferred_date: z.string().optional(),
  preferred_time: z.string().optional(),
  message: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const TrialBookingForm: React.FC<TrialBookingFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [availableTutors, setAvailableTutors] = useState<TutorAvailabilitySlot[]>([]);
  const [selectedYearGroup, setSelectedYearGroup] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parent_name: "",
      child_name: "",
      email: "",
      phone: "",
      year_group_id: "",
      subject_id: "",
      tutor_id: "",
      preferred_date: "",
      preferred_time: "",
      message: ""
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchYearGroups();
      fetchSubjects();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedSubject) {
      fetchAvailableTutors();
    }
  }, [selectedSubject]);

  const fetchYearGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('year_groups')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setYearGroups(data || []);
    } catch (error) {
      console.error('Error fetching year groups:', error);
      toast.error('Failed to load year groups');
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const fetchAvailableTutors = async () => {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select(`
          id,
          first_name,
          last_name,
          normal_hourly_rate,
          tutor_subjects!inner(subject_id),
          tutor_availability(
            day_of_week,
            start_time,
            end_time
          )
        `)
        .eq('tutor_subjects.subject_id', selectedSubject)
        .eq('status', 'active');

      if (error) throw error;

      const tutorSlots: TutorAvailabilitySlot[] = [];
      
      data?.forEach(tutor => {
        tutor.tutor_availability?.forEach((availability: any) => {
          tutorSlots.push({
            tutor_id: tutor.id,
            tutor_name: `${tutor.first_name} ${tutor.last_name}`,
            day_of_week: availability.day_of_week,
            start_time: availability.start_time,
            end_time: availability.end_time,
            normal_hourly_rate: tutor.normal_hourly_rate
          });
        });
      });

      setAvailableTutors(tutorSlots);
    } catch (error) {
      console.error('Error fetching available tutors:', error);
      toast.error('Failed to load available tutors');
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('trial_bookings')
        .insert({
          parent_name: data.parent_name,
          child_name: data.child_name,
          email: data.email,
          phone: data.phone,
          year_group_id: data.year_group_id,
          subject_id: data.subject_id,
          tutor_id: data.tutor_id || null,
          preferred_date: data.preferred_date || null,
          preferred_time: data.preferred_time || null,
          message: data.message,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Trial lesson request submitted successfully! We\'ll contact you within 24 hours.');
      onSuccess?.();
      onClose();
      form.reset();
    } catch (error: any) {
      console.error('Error submitting trial booking:', error);
      toast.error('Failed to submit trial lesson request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const groupedTutors = availableTutors.reduce((acc, slot) => {
    if (!acc[slot.tutor_id]) {
      acc[slot.tutor_id] = {
        tutor_name: slot.tutor_name,
        rate: slot.normal_hourly_rate,
        slots: []
      };
    }
    acc[slot.tutor_id].slots.push(slot);
    return acc;
  }, {} as Record<string, { tutor_name: string; rate: number; slots: TutorAvailabilitySlot[] }>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Book a Trial Lesson</DialogTitle>
          <DialogDescription>
            Book a free trial lesson with one of our expert tutors. We'll match you with the perfect tutor for your needs.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="parent_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Parent/Guardian Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="child_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Student Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Student's full name" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="your.email@example.com" type="email" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+44 7XXX XXXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="year_group_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year Group</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedYearGroup(value);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {yearGroups.map((yearGroup) => (
                            <SelectItem key={yearGroup.id} value={yearGroup.id}>
                              {yearGroup.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedSubject(value);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {availableTutors.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Available Tutors & Times</h3>
                  <div className="grid gap-4 max-h-60 overflow-y-auto">
                    {Object.entries(groupedTutors).map(([tutorId, tutorData]) => (
                      <Card key={tutorId} className="p-4">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center justify-between">
                            {tutorData.tutor_name}
                            <Badge variant="secondary">£{tutorData.rate}/hour</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-2">
                            {tutorData.slots.map((slot, index) => (
                              <Button
                                key={index}
                                type="button"
                                variant={form.watch('tutor_id') === tutorId ? "default" : "outline"}
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  form.setValue('tutor_id', tutorId);
                                  form.setValue('preferred_time', slot.start_time);
                                }}
                              >
                                {slot.day_of_week} {slot.start_time}-{slot.end_time}
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="preferred_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Preferred Date (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferred_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Preferred Time (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Additional Message (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about your learning goals, specific topics you'd like to focus on, or any other requirements..." 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            onClick={form.handleSubmit(onSubmit)}
          >
            {loading ? "Submitting..." : "Book Trial Lesson"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrialBookingForm;
