
import React, { useState, useEffect } from 'react';
import { format, addHours } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tutor } from '@/types/tutor';
import { Student } from '@/types/student';
import { performFullAvailabilityCheck, AvailabilityCheckResult, AvailabilityConflict } from '@/services/availabilityCheckService';

interface AvailabilityCheckDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  tutorId: z.string().min(1, { message: "Tutor is required" }),
  date: z.date({ required_error: "Date is required" }),
  startTime: z.string().min(1, { message: "Start time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  studentIds: z.array(z.number()).optional(),
});

const AvailabilityCheckDialog: React.FC<AvailabilityCheckDialogProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [checkResult, setCheckResult] = useState<AvailabilityCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tutorId: "",
      date: new Date(),
      startTime: format(new Date().setMinutes(0), "HH:mm"),
      endTime: format(addHours(new Date().setMinutes(0), 1), "HH:mm"),
      studentIds: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setCheckResult(null);
      setSelectedStudents([]);
      form.reset();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsFetchingData(true);
    try {
      // Fetch tutors
      const { data: tutorsData, error: tutorsError } = await supabase
        .from('tutors')
        .select('*')
        .eq('status', 'active')
        .order('last_name', { ascending: true });

      if (tutorsError) throw tutorsError;
      setTutors(tutorsData || []);

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active')
        .order('last_name', { ascending: true });
        
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleStudentSelect = (studentId: number) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Format the date and times into ISO strings
      const startTime = new Date(values.date);
      const [startHours, startMinutes] = values.startTime.split(':');
      startTime.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10));

      const endTime = new Date(values.date);
      const [endHours, endMinutes] = values.endTime.split(':');
      endTime.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10));

      const result = await performFullAvailabilityCheck({
        tutorId: values.tutorId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        studentIds: selectedStudents.length > 0 ? selectedStudents : undefined
      });

      setCheckResult(result);
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('Failed to check availability');
    } finally {
      setIsLoading(false);
    }
  };

  const getConflictIcon = (type: AvailabilityConflict['type']) => {
    switch (type) {
      case 'tutor_availability':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'lesson_conflict':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'time_off':
        return <CalendarIcon className="h-4 w-4 text-blue-500" />;
      case 'student_conflict':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConflictTypeLabel = (type: AvailabilityConflict['type']) => {
    switch (type) {
      case 'tutor_availability':
        return 'Availability';
      case 'lesson_conflict':
        return 'Lesson Conflict';
      case 'time_off':
        return 'Time Off';
      case 'student_conflict':
        return 'Student Conflict';
      default:
        return 'Conflict';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Check Availability</DialogTitle>
          <DialogDescription>
            Check for scheduling conflicts before creating a lesson
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="tutorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tutor</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                    disabled={isFetchingData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isFetchingData ? "Loading tutors..." : "Select a tutor"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isFetchingData ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading tutors...</span>
                        </div>
                      ) : tutors.length === 0 ? (
                        <div className="p-2 text-center text-muted-foreground">No tutors available</div>
                      ) : (
                        tutors.map((tutor) => (
                          <SelectItem key={tutor.id} value={tutor.id}>
                            {tutor.first_name} {tutor.last_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="pl-3 text-left font-normal w-full"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>Students (Optional)</FormLabel>
              <div className="border rounded-md p-2 max-h-[150px] overflow-y-auto bg-white mt-2">
                {isFetchingData ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Loading students...</span>
                  </div>
                ) : students.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground">No students available</div>
                ) : (
                  students.map((student) => {
                    const studentId = typeof student.id === 'string' 
                      ? parseInt(student.id, 10) 
                      : student.id;
                      
                    return (
                      <div 
                        key={studentId} 
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer mb-1 ${
                          selectedStudents.includes(studentId) ? 'bg-primary/10 border border-primary/30' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => handleStudentSelect(studentId)}
                      >
                        <span>{student.first_name} {student.last_name}</span>
                        {selectedStudents.includes(studentId) && (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              {selectedStudents.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            <Button type="submit" disabled={isLoading || isFetchingData} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking availability...
                </>
              ) : (
                'Check Availability'
              )}
            </Button>
          </form>
        </Form>

        {checkResult && (
          <div className="mt-6 space-y-4">
            <div className={`p-4 rounded-md border ${
              checkResult.isAvailable 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {checkResult.isAvailable ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                <h3 className={`font-semibold ${
                  checkResult.isAvailable ? 'text-green-800' : 'text-red-800'
                }`}>
                  {checkResult.isAvailable ? 'No conflicts found!' : 'Conflicts detected'}
                </h3>
              </div>
              
              {checkResult.isAvailable ? (
                <p className="text-green-700">
                  The selected time slot is available for scheduling.
                </p>
              ) : (
                <div className="space-y-3">
                  {checkResult.conflicts.map((conflict, index) => (
                    <div key={index} className="flex items-start gap-2">
                      {getConflictIcon(conflict.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-600">
                            {getConflictTypeLabel(conflict.type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{conflict.message}</p>
                      </div>
                    </div>
                  ))}
                  
                  {checkResult.suggestions && checkResult.suggestions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-red-200">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Suggestions:</h4>
                      <ul className="space-y-1">
                        {checkResult.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-red-700 flex items-start gap-1">
                            <span className="text-red-400 mt-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvailabilityCheckDialog;
