import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);

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
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      // If no profile exists, create one
      if (!data) {
        console.log('No profile found, creating one...');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            first_name: '',
            last_name: '',
          });
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
          if (insertError.code === '42501') {
            toast({
              title: 'Profile Creation Failed',
              description: 'Unable to create profile due to permissions. Please contact support.',
              variant: 'destructive',
            });
          }
        } else {
          // Initialize with empty values
          reset({
            first_name: '',
            last_name: '',
            email: user.email || '',
            phone_number: '',
            education_level: undefined,
            gcse_subject_ids: [],
            exam_boards: {},
          });
        }
        return;
      }

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
        .maybeSingle();

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
        <div className="space-y-2">
          <Label htmlFor="first_name" style={{ color: 'hsl(var(--cleo-text-dark))' }}>First Name</Label>
          <Input
            id="first_name"
            {...register('first_name')}
            placeholder="Enter your first name"
            className="bg-white border-gray-200 focus:border-green-400"
          />
          {errors.first_name && (
            <p className="text-sm text-destructive">{errors.first_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name" style={{ color: 'hsl(var(--cleo-text-dark))' }}>Last Name</Label>
          <Input
            id="last_name"
            {...register('last_name')}
            placeholder="Enter your last name"
            className="bg-white border-gray-200 focus:border-green-400"
          />
          {errors.last_name && (
            <p className="text-sm text-destructive">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" style={{ color: 'hsl(var(--cleo-text-dark))' }}>Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="Enter your email"
          className="bg-white border-gray-200 focus:border-green-400"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_number" style={{ color: 'hsl(var(--cleo-text-dark))' }}>Phone Number</Label>
        <Input
          id="phone_number"
          {...register('phone_number')}
          placeholder="Enter your phone number (optional)"
          className="bg-white border-gray-200 focus:border-green-400"
        />
      </div>

      {/* Education Level */}
      <div className="space-y-2">
        <Label style={{ color: 'hsl(var(--cleo-text-dark))' }}>Education Level</Label>
        <Select
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
          <SelectTrigger className="bg-white border-gray-200 focus:border-green-400">
            <SelectValue placeholder="Select education level" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50 border border-gray-200 shadow-lg">
            <SelectItem value="11_plus">11 Plus</SelectItem>
            <SelectItem value="gcse">GCSE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Learning Preferences Display Card */}
      {educationLevel && (
        <div className="space-y-3">
          <Label style={{ color: 'hsl(var(--cleo-text-dark))' }}>Learning Preferences</Label>
          
          <div 
            className="p-4 rounded-xl border border-[rgba(37,184,107,0.3)] bg-white"
            style={{ 
              boxShadow: '0 4px 12px rgba(15, 80, 60, 0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold" style={{ color: 'hsl(var(--cleo-text-dark))' }}>
                {educationLevel === '11_plus' ? '11 Plus' : 'GCSE'}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingPreferences(true)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                Edit ✏️
              </Button>
            </div>
            
            {educationLevel === 'gcse' && selectedSubjects.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium opacity-75">Selected Subjects:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedSubjects.map((subjectId) => {
                    const subject = availableSubjects.find(s => s.id === subjectId);
                    const board = examBoards[subjectId];
                    return (
                      <div 
                        key={subjectId}
                        className="px-3 py-1.5 rounded-full text-sm"
                        style={{
                          background: 'linear-gradient(135deg, #e9fff3, #e1fced)',
                          border: '1px solid rgba(37, 184, 107, 0.2)',
                          color: 'hsl(var(--cleo-text-dark))'
                        }}
                      >
                        {subject?.name} {board && `(${board})`}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {educationLevel === 'gcse' && selectedSubjects.length === 0 && (
              <div className="text-sm opacity-60">No subjects selected yet</div>
            )}
          </div>
        </div>
      )}
      </div>

      <Button 
        type="submit" 
        disabled={isLoading} 
        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
      >
        {isLoading ? 'Saving...' : 'Save Changes'}
      </Button>

      {/* Edit Preferences Dialog */}
      <Dialog open={isEditingPreferences} onOpenChange={setIsEditingPreferences}>
        <DialogContent className="max-w-2xl bg-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: 'hsl(var(--cleo-text-dark))' }}>
              Edit Learning Preferences
            </DialogTitle>
            <DialogDescription>
              Select your GCSE subjects and exam boards
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Multi-select buttons for subjects */}
            <div className="space-y-3">
              <Label>GCSE Subjects</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableSubjects.map((subject) => (
                  <Button
                    key={subject.id}
                    type="button"
                    variant={selectedSubjects.includes(subject.id) ? "default" : "outline"}
                    onClick={() => {
                      const isSelected = selectedSubjects.includes(subject.id);
                      let newSubjects: string[];
                      let newBoards = { ...examBoards };
                      
                      if (isSelected) {
                        newSubjects = selectedSubjects.filter(id => id !== subject.id);
                        delete newBoards[subject.id];
                      } else {
                        newSubjects = [...selectedSubjects, subject.id];
                      }
                      
                      setSelectedSubjects(newSubjects);
                      setExamBoards(newBoards);
                      setValue('gcse_subject_ids', newSubjects);
                      setValue('exam_boards', newBoards);
                    }}
                    className={`justify-start ${
                      selectedSubjects.includes(subject.id) 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-white hover:bg-green-50 border-gray-200'
                    }`}
                  >
                    {selectedSubjects.includes(subject.id) ? '✓ ' : ''}{subject.name}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Exam boards for selected subjects */}
            {selectedSubjects.length > 0 && (
              <div className="space-y-3">
                <Label>Exam Boards</Label>
                {selectedSubjects.map((subjectId) => {
                  const subject = availableSubjects.find(s => s.id === subjectId);
                  if (!subject) return null;
                  
                  return (
                    <div key={subjectId} className="flex items-center gap-3">
                      <Label className="w-40 text-sm">{subject.name}:</Label>
                      <Select
                        value={examBoards[subjectId] || ''}
                        onValueChange={(value) => {
                          const newBoards = { ...examBoards, [subjectId]: value };
                          setExamBoards(newBoards);
                          setValue('exam_boards', newBoards);
                        }}
                      >
                        <SelectTrigger className="flex-1 bg-white border-gray-200">
                          <SelectValue placeholder="Select board" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50 border border-gray-200 shadow-lg">
                          {EXAM_BOARDS.map((board) => (
                            <SelectItem key={board} value={board}>{board}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsEditingPreferences(false)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default ProfileSettings;
