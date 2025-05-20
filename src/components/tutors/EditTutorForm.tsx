
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, X } from 'lucide-react';

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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

// Update this interface to match the one in Tutors.tsx
interface Tutor {
  id: string;
  first_name: string;
  last_name: string;
  name?: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  specialities?: string[];
  status: 'active' | 'inactive' | 'pending';
  title?: string | null;
  education?: string | null;
  rating?: number | null;
  joined_date?: string;
}

interface EditTutorFormProps {
  tutor: Tutor | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (tutor: Tutor) => void;
}

const formSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
  bio: z.string().optional(),
  specialities: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'pending']),
});

type FormData = z.infer<typeof formSchema>;

const specialitiesList = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English Literature",
  "History",
  "Geography",
  "Computer Science",
  "Foreign Languages",
  "Music",
  "Art",
  "Physical Education",
  "Economics",
  "Business Studies",
  "Psychology",
  "Sociology",
  "Philosophy",
  "Religious Studies",
  "Drama",
  "Media Studies",
];

const EditTutorForm: React.FC<EditTutorFormProps> = ({ tutor, isOpen, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [selectedSpecialities, setSelectedSpecialities] = useState<string[]>([]);
  const [specialitiesOpen, setSpecialitiesOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      bio: "",
      specialities: [],
      status: 'active' as const,
    },
  });

  // Set form values when tutor changes
  useEffect(() => {
    if (tutor) {
      form.reset({
        first_name: tutor.first_name,
        last_name: tutor.last_name,
        email: tutor.email,
        phone: tutor.phone || "",
        bio: tutor.bio || "",
        specialities: tutor.specialities || [],
        status: tutor.status,
      });
      
      setSelectedSpecialities(tutor.specialities || []);
    }
  }, [tutor, form]);

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
          specialities: data.specialities,
          status: data.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tutor.id);
        
      if (error) throw error;
      
      // Update the tutor in the parent component
      const updatedTutor: Tutor = {
        ...tutor,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        specialities: data.specialities,
        status: data.status,
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

  const toggleSpeciality = (speciality: string) => {
    const isSelected = selectedSpecialities.includes(speciality);
    
    let updated: string[];
    if (isSelected) {
      updated = selectedSpecialities.filter(s => s !== speciality);
    } else {
      updated = [...selectedSpecialities, speciality];
    }
    
    setSelectedSpecialities(updated);
    form.setValue('specialities', updated);
  };

  const removeSpeciality = (speciality: string) => {
    const updated = selectedSpecialities.filter(s => s !== speciality);
    setSelectedSpecialities(updated);
    form.setValue('specialities', updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
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
            
            <FormField
              control={form.control}
              name="specialities"
              render={() => (
                <FormItem>
                  <FormLabel>Specialities</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedSpecialities.map((speciality) => (
                      <Badge 
                        key={speciality} 
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {speciality}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeSpeciality(speciality)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <Popover open={specialitiesOpen} onOpenChange={setSpecialitiesOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="justify-between w-full"
                        >
                          {selectedSpecialities.length > 0
                            ? `${selectedSpecialities.length} selected`
                            : "Select specialities"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Command>
                        <CommandInput placeholder="Search specialities..." />
                        <CommandEmpty>No specialities found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {specialitiesList.map((speciality) => {
                            const isSelected = selectedSpecialities.includes(speciality);
                            return (
                              <CommandItem
                                key={speciality}
                                value={speciality}
                                onSelect={() => toggleSpeciality(speciality)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {speciality}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
