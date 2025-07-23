import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { createTrialStudent } from '@/services/trialAccountService';
import { createTrialLesson } from '@/services/trialLessonService';
import DateTimeSelector from '@/components/trialBooking/DateTimeSelector';
import { useAggregatedAvailability } from '@/hooks/useAggregatedAvailability';

const TrialBookingPage: React.FC = () => {
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [subjects, setSubjects] = useState<{ id: string; name: string; }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/subjects');
        const data = await response.json();
        setSubjects(data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast({
          variant: "destructive",
          title: "Error!",
          description: "Failed to load subjects. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, [toast]);

  const { slots, isLoading: availabilityLoading, error } = useAggregatedAvailability(selectedSubject, selectedDate);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!parentName || !childName || !email || !selectedSubject || !selectedDate || !selectedTime) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Please fill in all required fields.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create trial student account
      const trialAccountResult = await createTrialStudent({
        parent_name: parentName,
        child_name: childName,
        email: email,
        phone: phone
      });

      if (!trialAccountResult.success) {
        throw new Error(trialAccountResult.error || 'Failed to create trial student account.');
      }

      // 2. Create trial lesson
      const trialLessonResult = await createTrialLesson({
        bookingId: 'trial-booking-' + Date.now(), // Temporary booking ID
        tutorId: slots.find(slot => slot.time === selectedTime)?.availableTutorIds[0] || '', // Select first available tutor
        studentId: trialAccountResult.studentId,
        preferredDate: selectedDate,
        preferredTime: selectedTime,
        subjectId: selectedSubject,
        approvedBy: 'system' // Or get current user
      });

      if (!trialLessonResult.success) {
        throw new Error(trialLessonResult.error || 'Failed to create trial lesson.');
      }

      // Success!
      toast({
        title: "Success!",
        description: "Trial lesson booked successfully!",
      });

      // Redirect to success page or dashboard
      navigate('/trial-booking-confirmation');
    } catch (err: any) {
      console.error('Error during trial booking:', err);
      toast({
        variant: "destructive",
        title: "Error!",
        description: err.message || 'An error occurred while booking the trial lesson.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Book a Trial Lesson</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information Form */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="parentName">Parent Name *</Label>
                <Input
                  type="text"
                  id="parentName"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="childName">Child Name *</Label>
                <Input
                  type="text"
                  id="childName"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Date and Time Selection */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Lesson Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Select onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DateTimeSelector
                slots={slots}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateSelect={setSelectedDate}
                onTimeSelect={setSelectedTime}
                isLoading={availabilityLoading}
                subjectId={selectedSubject}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <Button type="submit" size="lg" className="w-full md:w-auto" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Booking...
            </>
          ) : (
            "Book Trial Lesson"
          )}
        </Button>
      </div>
    </div>
  );
};

export default TrialBookingPage;
