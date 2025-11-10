import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.union([
    z.string().email('Please enter a valid email'),
    z.literal(''),
  ]).optional(),
  phone_number: z.string().optional(),
  education_level: z.enum(['11_plus', 'gcse']).optional(),
  gcse_subject_ids: z.array(z.string()).optional(),
  exam_boards: z.record(z.string()).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface Subject {
  id: string;
  name: string;
  category: string;
}

const EXAM_BOARDS = ['AQA', 'Edexcel', 'OCR', 'WJEC', 'Cambridge', 'CCEA', 'Eduqas'];

const ProfileSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [examBoards, setExamBoards] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const educationLevel = watch('education_level');

  // Fetch GCSE subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('category', 'gcse')
        .order('name');
      
      if (!error && data) {
        setAvailableSubjects(data);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone_number, education_level, gcse_subject_ids, exam_boards')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        const subjectIds = data.gcse_subject_ids || [];
        const boards = (data.exam_boards as Record<string, string>) || {};
        
        setSelectedSubjects(subjectIds);
        setExamBoards(boards);
        
        reset({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: user.email || '',
          phone_number: data.phone_number || '',
          education_level: data.education_level as '11_plus' | 'gcse' | undefined,
          gcse_subject_ids: subjectIds,
          exam_boards: boards,
        });
      }
    };

    fetchProfile();
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    console.log('Form data being submitted:', data);
    if (!user) return;

    setIsLoading(true);
    try {
      // Update email if changed and not empty
      if (data.email && data.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email,
        });
        if (emailError) throw emailError;
      }

      // Prepare update object with only provided fields
      const updates: any = {};
      
      if (data.first_name !== undefined && data.first_name !== '') updates.first_name = data.first_name;
      if (data.last_name !== undefined && data.last_name !== '') updates.last_name = data.last_name;
      if (data.phone_number !== undefined) updates.phone_number = data.phone_number || null;
      if (data.education_level !== undefined) updates.education_level = data.education_level || null;
      
      // Always update these as they might be cleared
      updates.gcse_subject_ids = data.gcse_subject_ids || [];
      updates.exam_boards = data.exam_boards || {};

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refetch profile to ensure UI is synced
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone_number, education_level, gcse_subject_ids, exam_boards')
        .eq('id', user.id)
        .single();

      if (updatedProfile) {
        const subjectIds = updatedProfile.gcse_subject_ids || [];
        const boards = (updatedProfile.exam_boards as Record<string, string>) || {};
        
        setSelectedSubjects(subjectIds);
        setExamBoards(boards);
        
        reset({
          first_name: updatedProfile.first_name || '',
          last_name: updatedProfile.last_name || '',
          email: user.email || '',
          phone_number: updatedProfile.phone_number || '',
          education_level: updatedProfile.education_level as '11_plus' | 'gcse' | undefined,
          gcse_subject_ids: subjectIds,
          exam_boards: boards,
        });
      }

      toast({
        title: '✅ Settings Saved!',
        description: 'Your settings have been successfully updated.',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            {...register('first_name')}
            placeholder="Enter your first name"
          />
          {errors.first_name && (
            <p className="text-sm text-destructive">{errors.first_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            {...register('last_name')}
            placeholder="Enter your last name"
          />
          {errors.last_name && (
            <p className="text-sm text-destructive">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="Enter your email"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_number">Phone Number</Label>
        <Input
          id="phone_number"
          {...register('phone_number')}
          placeholder="Enter your phone number (optional)"
        />
      </div>

      {/* Education Level */}
      <div className="space-y-2">
        <Label>Education Level</Label>
        <RadioGroup
          value={educationLevel || ''}
          onValueChange={(value) => {
            setValue('education_level', value as '11_plus' | 'gcse');
            if (value !== 'gcse') {
              setSelectedSubjects([]);
              setExamBoards({});
              setValue('gcse_subject_ids', []);
              setValue('exam_boards', {});
            }
          }}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="11_plus" id="11_plus" />
            <Label htmlFor="11_plus" className="font-normal cursor-pointer">
              11 Plus
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="gcse" id="gcse" />
            <Label htmlFor="gcse" className="font-normal cursor-pointer">
              GCSE
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* GCSE Subjects */}
      {educationLevel === 'gcse' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>GCSE Subjects</Label>
            <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/30">
              {availableSubjects.map((subject) => (
                <div key={subject.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={subject.id}
                    checked={selectedSubjects.includes(subject.id)}
                    onCheckedChange={(checked) => {
                      let newSubjects: string[];
                      let newBoards = { ...examBoards };
                      
                      if (checked) {
                        newSubjects = [...selectedSubjects, subject.id];
                      } else {
                        newSubjects = selectedSubjects.filter((id) => id !== subject.id);
                        delete newBoards[subject.id];
                      }
                      
                      setSelectedSubjects(newSubjects);
                      setExamBoards(newBoards);
                      setValue('gcse_subject_ids', newSubjects);
                      setValue('exam_boards', newBoards);
                    }}
                  />
                  <Label
                    htmlFor={subject.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {subject.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Exam Boards */}
          {selectedSubjects.length > 0 && (
            <div className="space-y-3">
              <Label>Exam Boards</Label>
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                {selectedSubjects.map((subjectId) => {
                  const subject = availableSubjects.find((s) => s.id === subjectId);
                  if (!subject) return null;

                  return (
                    <div key={subjectId} className="flex items-center gap-3">
                      <Label className="w-32 text-sm">{subject.name}:</Label>
                      <Select
                        value={examBoards[subjectId] || ''}
                        onValueChange={(value) => {
                          const newBoards = { ...examBoards, [subjectId]: value };
                          setExamBoards(newBoards);
                          setValue('exam_boards', newBoards);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select exam board" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXAM_BOARDS.map((board) => (
                            <SelectItem key={board} value={board}>
                              {board}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
        {isLoading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
};

export default ProfileSettings;
