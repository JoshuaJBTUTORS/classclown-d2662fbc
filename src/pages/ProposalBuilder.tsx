import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const lessonTimeSchema = z.object({
  day: z.string().min(1, 'Day is required'),
  time: z.string().min(1, 'Time is required'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes'),
});

const proposalSchema = z.object({
  recipientName: z.string().min(1, 'Recipient name is required').max(100),
  recipientEmail: z.string().email('Invalid email address').max(255),
  recipientPhone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[\d\s\+\-\(\)]+$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  lessonType: z.string().min(1, 'Lesson type is required'),
  subject: z.string().min(1, 'Subject is required'),
  pricePerLesson: z.number().min(0, 'Price must be positive'),
  paymentCycle: z.string().min(1, 'Payment cycle is required'),
  lessonTimes: z.array(lessonTimeSchema).min(1, 'At least one lesson time is required'),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

export default function ProposalBuilder() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lessonTimes, setLessonTimes] = useState<Array<{ day: string; time: string; duration: number }>>([
    { day: '', time: '', duration: 60 },
  ]);

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      recipientName: '',
      recipientEmail: '',
      recipientPhone: '',
      lessonType: '',
      subject: '',
      pricePerLesson: 45,
      paymentCycle: '',
      lessonTimes: [],
    },
  });

  const addLessonTime = () => {
    const newLessonTimes = [...lessonTimes, { day: '', time: '', duration: 60 }];
    setLessonTimes(newLessonTimes);
    form.setValue('lessonTimes', newLessonTimes);
  };

  const removeLessonTime = (index: number) => {
    const filtered = lessonTimes.filter((_, i) => i !== index);
    setLessonTimes(filtered);
    form.setValue('lessonTimes', filtered);
  };

  const updateLessonTime = (index: number, field: string, value: string | number) => {
    const updated = [...lessonTimes];
    updated[index] = { ...updated[index], [field]: value };
    setLessonTimes(updated);
    form.setValue('lessonTimes', updated);
  };

  const onSubmit = async (data: ProposalFormData) => {
    setIsSubmitting(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('create-lesson-proposal', {
        body: {
          ...data,
          recipientPhone: data.recipientPhone || null,
          lessonTimes: lessonTimes.filter(lt => lt.day && lt.time),
        },
      });

      if (error) throw error;

      toast({
        title: 'Proposal Created!',
        description: `Proposal sent to ${data.recipientEmail}. Shareable link copied!`,
      });

      // Copy shareable link to clipboard
      if (response?.proposalUrl) {
        await navigator.clipboard.writeText(response.proposalUrl);
      }

      navigate('/admin/proposals');
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create proposal',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Lesson Proposal</CardTitle>
          <CardDescription>
            Create a personalized lesson proposal to send to parents/students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="recipientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recipientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recipientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+44 7123 456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lessonType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lesson Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select lesson type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-to-1 Online">1-to-1 Online</SelectItem>
                          <SelectItem value="1-to-1 In-Person">1-to-1 In-Person</SelectItem>
                          <SelectItem value="Group Session">Group Session</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Mathematics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pricePerLesson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Lesson (£)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? 0 : parseFloat(value) || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentCycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Cycle</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment cycle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Per Lesson">Per Lesson</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Termly">Termly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Lesson Times</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={addLessonTime}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Time
                  </Button>
                </div>

                {lessonTimes.map((lessonTime, index) => (
                  <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <FormLabel>Day</FormLabel>
                        <Select
                          value={lessonTime.day}
                          onValueChange={(value) => updateLessonTime(index, 'day', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                              (day) => (
                                <SelectItem key={day} value={day}>
                                  {day}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <FormLabel>Time</FormLabel>
                        <Input
                          type="time"
                          value={lessonTime.time}
                          onChange={(e) => updateLessonTime(index, 'time', e.target.value)}
                        />
                      </div>

                      <div>
                        <FormLabel>Duration (min)</FormLabel>
                        <Input
                          type="number"
                          value={lessonTime.duration}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateLessonTime(index, 'duration', value === '' ? 60 : parseInt(value) || 60);
                          }}
                        />
                      </div>
                    </div>

                    {lessonTimes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLessonTime(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                <FormField
                  control={form.control}
                  name="lessonTimes"
                  render={() => (
                    <FormItem>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create & Send Proposal
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
