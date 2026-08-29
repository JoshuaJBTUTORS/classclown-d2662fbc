import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Parent } from '@/types/parent';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';

const chipOutline =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 text-sm font-medium bg-transparent text-foreground border border-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-foreground/5 disabled:opacity-50 disabled:pointer-events-none';
const pillDark =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 h-11 text-sm font-medium bg-foreground text-background transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none';
const iconChip =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-foreground/70 text-foreground';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddStudentToParentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedParentId?: string;
}

const formSchema = z.object({
  parent_id: z.string().min(1, { message: "Please select a parent." }),
  first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email format." }).optional().or(z.literal("")),
  phone: z.string().optional(),
  grade: z.string().optional(),
  subjects: z.string().optional(),
  createStudentLogin: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const DEFAULT_STUDENT_PASSWORD = 'classbeyond123!';

const AddStudentToParentForm: React.FC<AddStudentToParentFormProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  preselectedParentId 
}) => {
  const [loading, setLoading] = useState(false);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loadingParents, setLoadingParents] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parent_id: preselectedParentId || "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      grade: "",
      subjects: "",
      createStudentLogin: false,
    },
  });

  // Fetch parents
  useEffect(() => {
    if (isOpen) {
      fetchParents();
    }
  }, [isOpen]);

  const fetchParents = async () => {
    setLoadingParents(true);
    try {
      const { data, error } = await supabase
        .from('parents')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setParents(data || []);
    } catch (error: any) {
      console.error('Error fetching parents:', error);
      toast.error('Failed to load parents');
    } finally {
      setLoadingParents(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Create student record
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          parent_id: data.parent_id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email || null,
          phone: data.phone || null,
          grade: data.grade || null,
          subjects: data.subjects || null,
          status: 'active'
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // Create student login if requested
      if (data.createStudentLogin && data.email) {
        try {
          const { data: studentAuthData, error: studentAuthError } = await supabase.auth.signUp({
            email: data.email,
            password: DEFAULT_STUDENT_PASSWORD,
            options: {
              data: {
                first_name: data.first_name,
                last_name: data.last_name,
                role: 'student',
              }
            }
          });

          if (studentAuthError) {
            console.error('Student auth creation failed:', studentAuthError);
            toast.error(`Student created but login account failed: ${studentAuthError.message}`);
          } else if (studentAuthData.user) {
            // Link student account to student record
            const { error: linkError } = await supabase
              .from('students')
              .update({ user_id: studentAuthData.user.id })
              .eq('id', studentData.id);

            if (linkError) {
              console.error('Failed to link student account:', linkError);
              toast.error('Student created but failed to link login account');
            } else {
              toast.success(`Student created with login account! Default password: ${DEFAULT_STUDENT_PASSWORD}`);
            }
          }
        } catch (error: any) {
          console.error('Error creating student login:', error);
          toast.error(`Student created but login account failed: ${error.message}`);
        }
      } else {
        toast.success('Student added successfully!');
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast.error(error.message || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="cc-dialog sm:max-w-[500px] rounded-[var(--radius-soft)] border-0 shadow-[var(--shadow-soft-lg)] p-6 sm:p-8">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className={iconChip}>
              <UserPlus className="h-5 w-5" />
            </span>
            <DialogTitle className="font-heading text-2xl font-extrabold tracking-tight">Add Student to Parent</DialogTitle>
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingParents ? (
                        <SelectItem value="loading" disabled>Loading parents...</SelectItem>
                      ) : parents.length === 0 ? (
                        <SelectItem value="no-parents" disabled>No parents found</SelectItem>
                      ) : (
                        parents.map((parent) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            {parent.first_name} {parent.last_name} ({parent.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
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
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="student@example.com" type="email" {...field} />
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
                      <Input placeholder="123-456-7890" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade/Year Group</FormLabel>
                  <FormControl>
                    <Input placeholder="Year 10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subjects"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subjects</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Math, Physics, Chemistry (comma separated)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="createStudentLogin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox 
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Create student login account
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Student will get login credentials (default password: <strong>{DEFAULT_STUDENT_PASSWORD}</strong>)
                    </p>
                  </div>
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
                {loading ? "Adding..." : "Add Student"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentToParentForm;
